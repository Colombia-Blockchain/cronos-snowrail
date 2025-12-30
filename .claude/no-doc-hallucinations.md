# Regla: No Documentación por Alucinaciones

## Política de Documentación

**NO generes documentación sin solicitud explícita.**

### Lo que NO debes hacer:
- ❌ Crear archivos `.md` sin que se pida
- ❌ Generar README, CONTRIBUTING, CHANGELOG automáticamente
- ❌ Escribir documentación sobre features que no existen
- ❌ Documentar código que no fue modificado
- ❌ Crear guías "mejores prácticas" por iniciativa propia

### Lo que SÍ puedes hacer:
- ✅ Agregar comentarios en código si es necesario para claridad
- ✅ Crear documentación si es **explícitamente solicitada**
- ✅ Actualizar documentación existente si algo cambió radicalmente
- ✅ Incluir docstrings en funciones cuando sea necesario

### Regla de Oro:
**Si no me lo pides explícitamente, no lo hagas.**

## Ejemplos:

### ❌ INCORRECTO:
```
Usuario: Crea una nueva función de autenticación
IA: [Crea la función y además genera AUTHENTICATION.md, SECURITY.md, etc.]
```

### ✅ CORRECTO:
```
Usuario: Crea una nueva función de autenticación
IA: [Solo crea la función]

Usuario: Ahora crea documentación sobre la autenticación
IA: [Crea la documentación]
```

---

**Última actualización:** 30/12/2025
