"""
Algoritmo para remover fondos de imágenes (logos, productos, etc.)
sin perder calidad. Preserva huecos internos en letras (O, A, R, etc.).

Utiliza BiRefNet-General (mejor para huecos) + post-procesamiento por color.
"""

from pathlib import Path
import io
import numpy as np
from PIL import Image
from rembg import remove, new_session


# Modelos disponibles. birefnet-general maneja mejor huecos internos que u2net
MODEL_LOGO = "birefnet-general"
MODELS_AVAILABLE = (
    "birefnet-general",
    "birefnet-general-lite",
    "u2net",
    "u2netp",
    "birefnet-portrait",
)


def _estimate_background_color(image: Image.Image, margin_ratio: float = 0.1) -> np.ndarray:
    """
    Estima el color del fondo muestreando los bordes de la imagen.
    Útil para detectar huecos internos que conservan el color del fondo.
    """
    arr = np.array(image)
    if arr.ndim == 2:
        arr = np.stack([arr] * 3, axis=-1)
    h, w = arr.shape[:2]
    margin = max(1, int(min(h, w) * margin_ratio))

    # Muestrear píxeles de los 4 bordes
    samples: list[np.ndarray] = []
    samples.append(arr[:margin, :].reshape(-1, arr.shape[-1]))  # Superior
    samples.append(arr[-margin:, :].reshape(-1, arr.shape[-1]))  # Inferior
    samples.append(arr[:, :margin].reshape(-1, arr.shape[-1]))  # Izquierdo
    samples.append(arr[:, -margin:].reshape(-1, arr.shape[-1]))  # Derecho

    pixels = np.vstack(samples)
    return np.median(pixels, axis=0).astype(np.float32)


def _fix_internal_holes_by_color(
    image: Image.Image,
    original_rgb: np.ndarray,
    color_tolerance: int = 35,
) -> Image.Image:
    """
    Detecta y hace transparentes regiones que tienen color de fondo
    pero quedaron opacas (huecos internos en letras como O, A, R).
    """
    rgba = np.array(image)
    if rgba.shape[-1] != 4:
        return image

    rgb = rgba[..., :3].astype(np.float32)
    alpha = rgba[..., 3].copy()

    # Distancia al color de fondo
    diff = np.abs(rgb - original_rgb)
    color_match = np.all(diff <= color_tolerance, axis=-1)

    # Solo afectar píxeles opacos que coinciden con el fondo
    should_transparent = (alpha > 128) & color_match
    alpha[should_transparent] = 0
    rgba[..., 3] = alpha

    return Image.fromarray(rgba)


def _fix_internal_holes_by_contours(image: Image.Image) -> Image.Image:
    """
    Usa contornos para detectar huecos internos en la máscara alpha.
    Rellena con transparencia las regiones que son contornos hijos.
    """
    try:
        import cv2
    except ImportError:
        return image

    rgba = np.array(image)
    if rgba.shape[-1] != 4:
        return image

    alpha = rgba[..., 3].astype(np.uint8)
    # Contornos: 255 = opaco, 0 = transparente
    contours, hierarchy = cv2.findContours(
        alpha,
        cv2.RETR_CCOMP,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    if hierarchy is None or len(contours) == 0:
        return image

    hierarchy = hierarchy[0]
    alpha_out = alpha.copy()

    # Contornos con padre = huecos internos (rodeados por el objeto)
    for i, contour in enumerate(contours):
        if hierarchy[i][3] >= 0:  # Tiene padre → es hueco interno
            cv2.drawContours(alpha_out, [contour], -1, 0, -1)

    rgba[..., 3] = alpha_out
    return Image.fromarray(rgba)


def remove_background(
    input_path: str | Path,
    output_path: str | Path | None = None,
    *,
    model: str = MODEL_LOGO,
    alpha_matting: bool = False,
    alpha_matting_foreground_threshold: int = 240,
    alpha_matting_background_threshold: int = 10,
    fix_internal_holes: bool = True,
    color_tolerance: int = 35,
) -> Image.Image:
    """
    Remueve el fondo de una imagen preservando huecos internos (letras O, A, R).

    Args:
        input_path: Ruta de la imagen de entrada
        output_path: Ruta de salida. Si es None, retorna sin guardar
        model: Modelo de segmentación. 'birefnet-general' es óptimo para logos
        alpha_matting: Refina bordes (más lento)
        alpha_matting_foreground_threshold: Umbral primer plano (0-255)
        alpha_matting_background_threshold: Umbral fondo (0-255)
        fix_internal_holes: Post-procesar huecos internos por color
        color_tolerance: Tolerancia RGB para detectar color de fondo (0-100)

    Returns:
        Imagen PIL con fondo transparente
    """
    input_path = Path(input_path)
    if not input_path.exists():
        raise FileNotFoundError(f"No se encontró la imagen: {input_path}")

    # Cargar original para estimar color de fondo (detectar huecos internos)
    original = Image.open(input_path).convert("RGB")
    bg_color = _estimate_background_color(original)

    with open(input_path, "rb") as f:
        input_data = f.read()

    session = new_session(model)
    output_data = remove(
        input_data,
        session=session,
        alpha_matting=alpha_matting,
        alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
        alpha_matting_background_threshold=alpha_matting_background_threshold,
    )

    image = Image.open(io.BytesIO(output_data)).convert("RGBA")

    if fix_internal_holes:
        # 1. Por color: huecos que conservan color de fondo
        image = _fix_internal_holes_by_color(image, bg_color, color_tolerance)
        # 2. Por contornos: huecos que quedaron en la máscara
        image = _fix_internal_holes_by_contours(image)

    if output_path:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(output_path, "PNG", compress_level=6)

    return image


def remove_background_from_folder(
    input_dir: str | Path,
    output_dir: str | Path,
    extensions: tuple[str, ...] = (".png", ".jpg", ".jpeg", ".webp"),
    model: str = MODEL_LOGO,
    alpha_matting: bool = False,
    fix_internal_holes: bool = True,
) -> list[Path]:
    """
    Procesa todas las imágenes de una carpeta.
    """
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    processed: list[Path] = []
    for file_path in input_dir.iterdir():
        if file_path.suffix.lower() in extensions:
            out_path = output_dir / f"{file_path.stem}_nobg.png"
            remove_background(
                file_path,
                out_path,
                model=model,
                alpha_matting=alpha_matting,
                fix_internal_holes=fix_internal_holes,
            )
            processed.append(out_path)

    return processed


def main() -> None:
    """Ejemplo de uso desde línea de comandos."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Remueve el fondo preservando huecos en letras (O, A, R)"
    )
    parser.add_argument("input", type=str, help="Ruta de la imagen o carpeta")
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Ruta de salida (por defecto: input_nobg.png)",
    )
    parser.add_argument(
        "-m", "--model",
        type=str,
        default=MODEL_LOGO,
        choices=MODELS_AVAILABLE,
        help=f"Modelo de segmentación (default: {MODEL_LOGO})",
    )
    parser.add_argument(
        "--alpha-matting",
        action="store_true",
        help="Refinar bordes (más lento)",
    )
    parser.add_argument(
        "--no-fix-holes",
        action="store_true",
        help="Desactivar corrección de huecos internos",
    )
    parser.add_argument(
        "--color-tolerance",
        type=int,
        default=35,
        metavar="N",
        help="Tolerancia para detectar color de fondo (0-100, default: 35)",
    )
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Procesar todos los archivos de una carpeta",
    )

    args = parser.parse_args()
    input_path = Path(args.input)

    if args.batch:
        output_dir = Path(args.output) if args.output else input_path / "output"
        results = remove_background_from_folder(
            input_path,
            output_dir,
            model=args.model,
            alpha_matting=args.alpha_matting,
            fix_internal_holes=not args.no_fix_holes,
        )
        print(f"Procesadas {len(results)} imágenes en {output_dir}")
    else:
        output_path = args.output or str(input_path.parent / f"{input_path.stem}_nobg.png")
        remove_background(
            input_path,
            output_path,
            model=args.model,
            alpha_matting=args.alpha_matting,
            fix_internal_holes=not args.no_fix_holes,
            color_tolerance=args.color_tolerance,
        )
        print(f"Imagen guardada en: {output_path}")


if __name__ == "__main__":
    main()
