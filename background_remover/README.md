# Removedor de fondos para imágenes

Algoritmo en Python para quitar el fondo a imágenes (logos, productos, etc.) **preservando los huecos internos** en letras (O, A, R, etc.). Utiliza **BiRefNet-General** + post-procesamiento por color y contornos.

## Instalación

```bash
cd background_remover
pip install -r requirements.txt
```

> **Nota:** La primera ejecución descargará el modelo BiRefNet-General (~973 MB). Las siguientes serán más rápidas.

## Uso

### Línea de comandos

**Una sola imagen (recomendado para logos):**
```bash
python background_remover.py logo.png
# Salida: logo_nobg.png
```

**Con refinado de bordes:**
```bash
python background_remover.py logo.png --alpha-matting
```

**Ajustar detección de huecos** (si el fondo no se elimina bien dentro de letras):
```bash
python background_remover.py logo.png --color-tolerance 50
```

**Procesar carpeta completa:**
```bash
python background_remover.py ./imagenes/ --batch -o ./resultados/
```

**Desactivar corrección de huecos** (solo modelo):
```bash
python background_remover.py logo.png --no-fix-holes
```

### Uso programático

```python
from background_remover import remove_background

# Básico (BiRefNet-General + fix de huecos)
img = remove_background("logo.png", "logo_sin_fondo.png")

# Con alpha matting
img = remove_background(
    "logo.png",
    "logo_sin_fondo.png",
    alpha_matting=True,
)

# Ajustar tolerancia de color para fondos complejos
img = remove_background(
    "logo.png",
    "logo_sin_fondo.png",
    color_tolerance=50,
)

# Sin corrección de huecos
img = remove_background("logo.png", "logo_sin_fondo.png", fix_internal_holes=False)
```

## Mejoras para logos con letras

1. **BiRefNet-General**: Modelo que maneja mejor huecos internos que U2-Net (anillos, letras O/A/R).
2. **Post-procesamiento por color**: Detecta regiones opacas que conservan el color del fondo y las hace transparentes.
3. **Post-procesamiento por contornos**: Rellena huecos internos detectados en la máscara alpha.

## Formatos soportados

- **Entrada:** PNG, JPG, JPEG, WEBP
- **Salida:** PNG (preserva transparencia sin pérdida)
