# PROMPT: ENTITY EXTRACTOR

Analiza el siguiente texto y extrae SOLO los nombres de personas o empresas mencionados.
Si no hay nombres, devuelve un array vacío.

## REGLAS:
- Extrae nombres propios de personas (ej: "Claudio", "María Pérez")
- Extrae nombres de empresas (ej: "Restaurante El Buen Sabor", "Ferretería Central")
- NO extraes palabras comunes o genéricas
- Devuelve SOLO un array JSON de strings

## FORMATO DE RESPUESTA:

```json
["Nombre 1", "Nombre 2", "Empresa X"]
```

Si no hay entidades, devuelve:
```json
[]
```

---

## TEXTO A ANALIZAR:
{text}
