# LM Studio - Konfiguration

## prompt-template.jinja

Fixad Jinja prompt-template for Nemotron 3 Nano i LM Studio.

### Vad ar fixat

Originaltemplatens `| string` och `| tojson`-filter kraschar nar DeerFlow skickar
tool-definitioner med `null`-varden. Denna version lagger till `is not none`-kontroller
overallt innan filter appliceras.

### Hur man anvander den

1. Oppna LM Studio
2. Ga till modell-installningar (kugghjulet vid modellen)
3. Hitta **Prompt Template** / **Chat Template**
4. Valj **Manual** / **Override**
5. Kopiera innehallet fran `prompt-template.jinja` och klistra in
6. Spara och starta om servern

### Funktioner

- Full tool/function-calling support (ChatML-format)
- Null-safe: hanterar `null`-varden i tool-parametrar
- Thinking/reasoning med `<think>`-taggar
- Svenska som resonemangssprak (`Jag resonerar pa svenska:`)
