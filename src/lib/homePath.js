export function homePathFor(user) {
  if (!user) return '/login'
  if (user.mustChangePassword) return '/cambiar-clave'
  return user.role === 'admin' ? '/admin' : '/portal'
}
