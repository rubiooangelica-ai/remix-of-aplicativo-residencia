import type { Material } from "@/lib/conteudo";

const agora = "2026-09-14T00:00:00.000Z";

export const MATERIAL_CRESCIMENTO_DESENVOLVIMENTO: Material = {
  id: "material-pediatria-puericultura-crescimento-apostila",
  titulo: "Puericultura e Crescimento",
  subtitulo:
    "Apostila completa de Pediatria: consulta de puericultura, anamnese, exame físico, antropometria, curvas, velocidade de crescimento, canal familiar, idade óssea, baixa estatura, crescimento puberal e suplementação preventiva.",
  status: "publicado",
  nivel: "residencia",
  origem: "misto",
  areaId: null,
  especialidadeId: null,
  assuntoId: null,
  fontes: [
    { tipo: "anotacao", titulo: "Anotações de Pediatria — 5º semestre", ano: 2026 },
    {
      tipo: "guideline",
      titulo: "Consulta de Puericultura — Sociedade Brasileira de Pediatria",
      ano: 2023,
      referencia: "Departamento Científico de Pediatria Ambulatorial",
    },
    {
      tipo: "guideline",
      titulo: "Avaliação do crescimento: o que o pediatra precisa saber — Sociedade Brasileira de Pediatria",
      ano: 2023,
      referencia: "Manual de Orientação nº 64 — Departamento Científico de Endocrinologia",
    },
    {
      tipo: "guideline",
      titulo: "Caderneta da Criança — Ministério da Saúde",
      ano: 2026,
      referencia: "Caderneta física e digital para acompanhamento integral da criança",
    },
    {
      tipo: "guideline",
      titulo: "WHO Child Growth Standards",
      ano: 2006,
      referencia: "Curvas de crescimento da Organização Mundial da Saúde",
    },
  ],
  imagens: [],
  pontosProva: [
    "Uma medida isolada não define normalidade: interprete trajetória, velocidade de crescimento e canal familiar.",
    "SBP: estatura normal entre P2,5 e P97,5; baixa estatura < P2,5; canais P2,5–P10 e P90–P97,5 exigem vigilância.",
    "Velocidade aproximada: 25 cm/ano no 1º ano; 10–13 cm/ano de 1–2 anos; 7 cm/ano de 2–4; 6 cm/ano de 4–6; ~5 cm/ano até puberdade.",
    "Estirão puberal: meninas geralmente Tanner M2–M3, 8–10 cm/ano; meninos G3–G4, 10–12 cm/ano.",
    "Altura-alvo: meninos = (pai + mãe + 13)/2; meninas = (pai + mãe − 13)/2; SBP utiliza faixa aproximada de ±5 cm.",
    "Comprimento deitado é cerca de 0,7 cm maior que estatura em pé; erro de técnica pode simular queda de canal.",
    "Peso costuma duplicar por volta de 4–5 meses e triplicar ao final do primeiro ano.",
    "Perda de até cerca de 10% do peso nos primeiros dias pode ser fisiológica, mas deve haver recuperação progressiva, usualmente até 10–14 dias.",
    "GH basal isolado não é exame de triagem adequado para baixa estatura.",
    "Crescimento acelerado também pode ser patológico: mudança ascendente de canal pode sugerir puberdade precoce ou outras condições.",
  ],
  conteudo: String.raw`# Puericultura e Crescimento

## Visão geral

A **puericultura** é o acompanhamento longitudinal da criança e do adolescente com foco em promoção da saúde, prevenção de agravos e reconhecimento precoce de alterações. Crescimento é um dos seus pilares, mas nunca deve ser analisado isoladamente: alimentação, vacinação, sono, atividade física, ambiente familiar, condições psicossociais, puberdade e doenças intercorrentes modificam a interpretação de cada medida.

> **IDEIA CENTRAL**
>
> **Tamanho não é crescimento.** Tamanho é a medida de hoje; crescimento é a mudança dessa medida ao longo do tempo. Uma criança pode estar em percentil baixo e ser normal, ou estar em percentil “normal” e apresentar desaceleração patológica.

---

## Sumário

1. Puericultura: conceito e objetivos  
2. Fases da infância  
3. Periodicidade das consultas  
4. Anamnese de puericultura  
5. Exame físico pediátrico  
6. Antropometria: princípios gerais  
7. Peso  
8. Comprimento e estatura  
9. Perímetro cefálico  
10. Pressão arterial  
11. Fontanelas e maturação puberal  
12. Fases do crescimento  
13. Curvas de crescimento e índices antropométricos  
14. Percentil e escore-Z  
15. Velocidade de crescimento  
16. Crescimento no primeiro ano  
17. Crescimento na puberdade  
18. Canal familiar / altura-alvo  
19. Idade óssea  
20. Baixa estatura  
21. Variantes normais: baixa estatura familiar e atraso constitucional  
22. Sinais de alerta e quando investigar  
23. Exames iniciais na baixa estatura  
24. Crescimento do prematuro  
25. Vitamina D e ferro na puericultura  
26. Como interpretar uma curva na prática  
27. Pegadinhas de residência  
28. Checklist final

---

# 1. Puericultura: conceito e objetivos

A puericultura é a consulta periódica de acompanhamento da infância e adolescência. A Sociedade Brasileira de Pediatria a coloca como um dos pilares da Pediatria porque permite acompanhar **crescimento, alimentação, imunizações, sono, atividade física, saúde emocional, desempenho escolar, prevenção de acidentes e ambiente familiar**.

A consulta não deve ser reduzida a “pesar e medir”. O raciocínio de puericultura é preventivo: identificar fatores de risco **antes** de a doença estar plenamente instalada.

### O que deve ser avaliado ao longo do seguimento

| Eixo | O que avaliar |
|---|---|
| Crescimento | Peso, comprimento/estatura, IMC, perímetro cefálico, trajetória e velocidade |
| Nutrição | Aleitamento, alimentação complementar, hábitos, suplementações |
| Imunizações | Calendário, atrasos, contraindicações reais e falsas |
| Sono | Duração, rotina, despertares, ronco e sinais de apneia |
| Atividade física | Brincadeiras, esporte, sedentarismo |
| Telas | Tempo, conteúdo e interferência no sono, alimentação e rotina |
| Escolar | Aprendizagem, rendimento, comportamento |
| Ambiente | Segurança, violência, tabagismo, condições sanitárias, rede de apoio |
| Puberdade | Estágios de Tanner e ritmo de maturação |
| Saúde bucal | Higiene, dentição, dieta cariogênica |
| Prevenção | Acidentes, afogamento, trânsito, intoxicações, queimaduras |

> **COMO CAI EM PROVA**
>
> Quando o enunciado disser “consulta de rotina”, “puericultura” ou “criança hígida”, pense em **vigilância longitudinal**, não em procurar uma doença específica.

---

# 2. Fases da infância

Nas suas anotações, a divisão prática usada no semestre é:

| Fase | Faixa etária |
|---|---:|
| Recém-nascido | 0–28 dias |
| Lactente | 29 dias–2 anos |
| Lactente jovem | 0–2 meses |
| Pré-escolar | 2–6 anos |
| Escolar | 6–10 anos |
| Adolescente | 10–20 anos incompletos |

Essa divisão ajuda a entender que cada faixa etária tem **ritmo de crescimento, riscos e prioridades diferentes**.

---

# 3. Periodicidade das consultas de puericultura

## Sociedade Brasileira de Pediatria

A página de puericultura da SBP orienta acompanhamento próximo nos primeiros anos:

| Idade | Periodicidade prática da SBP |
|---|---|
| Gestação | Consulta pediátrica pré-natal no 3º trimestre quando possível |
| Após nascimento | Primeira consulta entre 7 e 10 dias de vida |
| 0–6 meses | Mensal |
| 6–12 meses | Bimestral |
| 12–18 meses | Trimestral |
| 18 meses–5 anos | Semestral |
| 5–18 anos | Anual |

Nas suas anotações aparece uma versão didática semelhante: sala de parto e alta neonatal; primeira/segunda semana; mensal até 6 meses; trimestral até 2 anos; semestral até 5 anos; anual até 19 anos.

## Ministério da Saúde

O Ministério da Saúde trabalha com acompanhamento programado na atenção primária, com maior densidade de consultas no primeiro ano e seguimento longitudinal posteriormente. A Caderneta da Criança é o instrumento central de registro de crescimento, vacinação e demais componentes do cuidado.

> **IMPORTANTE**
>
> Para prova, preste atenção na **fonte pedida pelo enunciado**. A periodicidade pode ser apresentada de forma diferente conforme MS, SBP ou protocolo local.

---

# 4. Anamnese de puericultura

A anamnese precisa ser completa mesmo quando a criança “não tem queixa”.

## História atual e rotina

- queixa atual;
- história da doença atual quando houver;
- alimentação e recordatório alimentar;
- aleitamento;
- qualidade e duração do sono;
- evacuações e diurese;
- atividade física;
- tempo de tela;
- desempenho escolar;
- comportamento;
- rotina familiar;
- segurança do ambiente.

## Antecedentes

- pré-natal;
- doenças maternas;
- medicamentos e exposições durante a gestação;
- idade gestacional;
- tipo de parto;
- peso, comprimento e perímetro cefálico ao nascimento;
- necessidade de UTI neonatal;
- intercorrências neonatais;
- doenças anteriores;
- internações;
- cirurgias;
- uso crônico de medicamentos.

## História familiar

Na avaliação do crescimento, história familiar é particularmente importante:

- altura dos pais;
- idade de início puberal dos pais;
- menarca materna;
- familiares com baixa ou alta estatura;
- doenças endócrinas;
- síndromes genéticas;
- doença celíaca;
- doenças renais;
- doenças inflamatórias crônicas.

> **RACIOCÍNIO CLÍNICO**
>
> Criança baixa + pais baixos + velocidade normal + exame normal → pense primeiro em **baixa estatura familiar**.
>
> Criança baixa + pais de altura normal + desaceleração da curva → investigue.

---

# 5. Exame físico pediátrico na puericultura

A consulta deve respeitar o vínculo com a criança.

### Sequência prática

1. Observe antes de tocar.
2. Avalie interação, estado geral, cor, hidratação e padrão respiratório.
3. Explique o que será feito.
4. Em lactentes, faça ausculta cardíaca e pulmonar enquanto ainda estão tranquilos, muitas vezes no colo do cuidador.
5. Deixe procedimentos mais incômodos, como oroscopia e otoscopia, para o final.

## Pontos relevantes para crescimento

- proporções corporais;
- dismorfias;
- sinais de doença crônica;
- estado nutricional;
- edema;
- pele e cabelos;
- tireoide;
- abdome e visceromegalias;
- deformidades ósseas;
- coluna;
- membros;
- estágio puberal de Tanner;
- pressão arterial;
- fontanelas no lactente.

> **PEGADINHA**
>
> Baixa estatura **desproporcionada** aponta para causas esqueléticas/genéticas e merece raciocínio diferente da baixa estatura proporcional.

---

# 6. Antropometria: princípios gerais

A SBP ressalta que a antropometria é simples, mas **erro técnico pode produzir conclusões erradas**, especialmente sobre velocidade de crescimento.

Antes de interpretar qualquer dado:

- confirme a data de nascimento;
- calcule a idade exata;
- verifique prematuridade;
- use equipamento adequado e calibrado;
- repita medidas inesperadas;
- use sempre que possível o mesmo método e instrumento em medidas seriadas;
- registre a medida imediatamente;
- plote na curva correta para sexo e idade.

> **REGRA DE OURO**
>
> Mudança inesperada de canal deve ser **confirmada com nova aferição** antes de iniciar investigação.

---

# 7. Peso

## Técnica

### Lactentes e crianças pequenas

- utilizar balança pediátrica;
- zerar a balança;
- retirar roupas pesadas;
- preferir pesagem sem fralda ou com condição padronizada;
- manter segurança durante toda a aferição.

### Criança que permanece em pé

- usar balança de plataforma;
- sem calçados;
- roupas leves;
- peso distribuído igualmente nos dois pés.

## Interpretação

Peso é muito sensível a variações agudas:

- ingestão;
- vômitos;
- diarreia;
- desidratação;
- edema;
- doença infecciosa.

Por isso, **peso/idade sozinho não diferencia problema agudo de comprometimento crônico**.

### Quando o peso cai antes da altura

Em desnutrição adquirida e em muitas doenças sistêmicas, o peso tende a sofrer primeiro. A estatura pode ser preservada inicialmente e cair mais tarde se o problema persistir.

### Quando a altura cai com peso preservado ou aumentado

Pense com mais força em causas endócrinas, por exemplo:

- hipotireoidismo;
- excesso de glicocorticoide;
- deficiência de GH.

Isso não é regra absoluta, mas é uma pista de prova muito útil.

---

# 8. Comprimento e estatura

## Menores de 2 anos: comprimento deitado

Idealmente em infantômetro, com duas pessoas:

- cabeça encostada;
- corpo alinhado;
- quadris e joelhos adequadamente posicionados;
- pernas estendidas;
- pés perpendiculares à base móvel.

## Maiores de 2 anos: estatura em pé

- sem calçados;
- calcanhares apoiados;
- corpo ereto;
- cabeça em plano de Frankfurt;
- olhar horizontal;
- haste do estadiômetro tocando o vértex.

A SBP ressalta que existe diferença aproximada de **0,7 cm** entre a medida deitada e a medida em pé: o comprimento deitado tende a ser maior.

| Situação | Correção prática citada pela SBP |
|---|---|
| ≥2 anos medido deitado | subtrair aproximadamente 0,7 cm antes de plotar em curva de estatura |
| <2 anos medido em pé | acrescentar aproximadamente 0,7 cm antes de plotar em curva de comprimento |

Na transição de método, o ideal é comparar medidas feitas de forma consistente.

## Como melhorar a precisão

A SBP orienta aferições repetidas. Quando houver diferença relevante entre medidas, repita e utilize média das medidas mais próximas, porque pequenos erros se amplificam no cálculo da velocidade de crescimento.

---

# 9. Perímetro cefálico

É especialmente importante nos primeiros anos de vida porque acompanha o crescimento craniano.

## Técnica

Use fita métrica:

- flexível;
- inelástica;
- passando anteriormente pela região supraorbitária;
- lateralmente acima das orelhas;
- posteriormente pela maior proeminência occipital.

Faça mais de uma aferição e registre o **maior perímetro** corretamente obtido.

Nas suas anotações, aparecem valores próximos ao nascimento de:

- menino: 31,9 cm;
- menina: 31,5 cm.

Esses números isolados têm utilidade limitada; o mais importante é avaliar:

- sexo;
- idade gestacional;
- idade cronológica/corrigida;
- trajetória na curva;
- contexto neurológico e craniano.

> **ALERTA**
>
> Perímetro cefálico muito abaixo ou acima do esperado, ou mudança sustentada de canal, precisa de confirmação da medida e investigação clínica.

---

# 10. Pressão arterial na puericultura

Nas suas anotações:

- aferir rotineiramente a partir dos 3 anos;
- antes dos 3 anos, aferir quando houver fator de risco;
- em certas comorbidades, aferir em todas as consultas.

### Exemplos de fatores de risco antes dos 3 anos

- doença renal;
- malformações renais;
- cardiopatia congênita;
- prematuridade importante;
- anemia falciforme.

### Situações em que a vigilância é ainda mais importante

- obesidade;
- coarctação de aorta;
- doença renal;
- uso de medicamentos que elevam PA.

O manguito inadequado é causa clássica de erro. A bolsa inflável deve ser compatível com o braço da criança.

---

# 11. Fontanelas e maturação puberal

## Fontanelas

| Fontanela | Características |
|---|---|
| Anterior | losangular; cerca de 1–4 cm; fechamento geralmente entre 9–18 meses |
| Posterior | triangular; cerca de 0,5 cm; fechamento geralmente até cerca de 2 meses |

O fechamento deve ser interpretado junto com:

- perímetro cefálico;
- formato craniano;
- crescimento linear;
- sinais de raquitismo;
- estado de hidratação;
- quadro neurológico.

## Tanner

O estadiamento puberal é essencial porque o ritmo de crescimento muda com a puberdade.

Nas suas anotações e no manual da SBP:

- meninas: estirão costuma ocorrer em **M2–M3**;
- meninos: estirão costuma ocorrer em **G3–G4**.

> **PROVA**
>
> Não interprete velocidade de crescimento de adolescente sem olhar Tanner.

---

# 12. Fases do crescimento

O crescimento não ocorre na mesma velocidade durante toda a infância.

## Fase intrauterina

É a fase de maior velocidade. Sofre forte influência de:

- ambiente uterino;
- função placentária;
- nutrição materna;
- doenças maternas;
- infecções;
- genética.

## Lactente: 0–2 anos

Período de crescimento muito intenso após o nascimento. Há forte influência de fatores extrínsecos, principalmente:

- alimentação;
- infecções;
- doenças;
- condições socioeconômicas.

## Infância: após 2 anos até puberdade

O crescimento se torna mais estável e a influência genética fica mais evidente.

Aqui é especialmente importante avaliar **velocidade anual**, porque medir mês a mês pode gerar ruído e interpretações erradas.

## Puberdade

O eixo hormonal produz aceleração do crescimento e, posteriormente, maturação e fechamento das cartilagens de crescimento.

---

# 13. Curvas de crescimento e índices antropométricos

A curva serve para responder duas perguntas:

1. **Onde a criança está?**
2. **Como ela está caminhando ao longo do tempo?**

A segunda pergunta é geralmente mais importante.

## Principais índices

| Índice | Principal utilidade |
|---|---|
| Peso/idade | visão global do peso em relação à idade |
| Comprimento ou estatura/idade | crescimento linear e rastreio de baixa estatura |
| Peso/comprimento ou peso/estatura | relação entre massa corporal e crescimento linear, especialmente em menores |
| IMC/idade | magreza, sobrepeso e obesidade |
| Perímetro cefálico/idade | crescimento craniano nos primeiros anos |

Nas suas anotações:

- comprimento/estatura por idade: curvas infantis até 5 anos e estatura até adolescência;
- peso/idade: especialmente útil na infância;
- peso/estatura: até 5 anos;
- IMC/idade: até 19 anos;
- perímetro cefálico: principalmente primeiros 2 anos.

---

# 14. Percentil e escore-Z

## Percentil

Percentil informa a posição relativa na população de referência.

- P50 = mediana;
- P75 = 75% das crianças da mesma idade/sexo estão abaixo daquela medida;
- P5 = apenas 5% estão abaixo.

## Escore-Z

Mostra quantos desvios-padrão a medida está da média.

| Escore-Z | Percentil aproximado |
|---:|---:|
| +3 | 99,8 |
| +2 | 97,7 |
| +1 | 84,2 |
| 0 | 50 |
| -1 | 15,8 |
| -2 | 2,3 |
| -3 | 0,15 |

### Normalidade não é apenas estar entre -2 e +2

Uma criança pode permanecer dentro desse intervalo e ainda assim ter problema se:

- estava no P90 e caiu para P25;
- sua velocidade caiu;
- parou de crescer;
- está distante do canal familiar.

> **IDEIA CENTRAL**
>
> **Curva é filme, não fotografia.**

---

# 15. Velocidade de crescimento

A velocidade de crescimento é um dos parâmetros mais importantes para diferenciar variante normal de doença.

A SBP apresenta valores aproximados:

| Faixa etária | Velocidade aproximada |
|---|---:|
| Fetal | 60–70 cm/ano |
| Nascimento–12 meses | ~25 cm/ano |
| 1–2 anos | 10–13 cm/ano |
| 2–4 anos | ~7 cm/ano |
| 4–6 anos | ~6 cm/ano |
| 6 anos até início da puberdade | ~5 cm/ano |
| Estirão puberal — meninas | 8–10 cm/ano |
| Estirão puberal — meninos | 10–12 cm/ano |

### Como calcular

    velocidade = (altura atual − altura anterior) / intervalo em anos

Exemplo:

- 120 cm há 1 ano;
- 125 cm hoje;
- velocidade = 5 cm/ano.

### Por que intervalos curtos enganam?

Se você mede em 3 meses e erra 0,5 cm, ao extrapolar para “cm/ano” o erro também é multiplicado. Por isso, velocidade precisa de medidas tecnicamente confiáveis e intervalo adequado.

---

# 16. Crescimento no primeiro ano de vida

Esse bloco é muito cobrado.

## Perda ponderal neonatal

Nos primeiros dias, é comum haver perda de peso por:

- eliminação de excesso de líquido;
- eliminação de mecônio;
- adaptação da ingestão.

Nas suas anotações, perda de até **10%** é considerada fisiológica, com recuperação em torno do **10º–14º dia**.

Perda excessiva ou recuperação inadequada exige avaliar:

- pega e transferência de leite;
- frequência das mamadas;
- diurese;
- sinais de desidratação;
- icterícia;
- doença.

## Ganho ponderal aproximado

| Período | Ganho médio didático das suas anotações |
|---|---:|
| 1º trimestre | ~700 g/mês |
| 2º trimestre | ~600 g/mês |
| 3º trimestre | ~500 g/mês |
| 4º trimestre | ~300 g/mês |

### Regra prática

- peso duplica em torno de **4–5 meses**;
- triplica por volta de **12 meses**.

## Crescimento linear

A SBP aponta aproximadamente **25 cm no primeiro ano**.

Isso significa que um recém-nascido com cerca de 50 cm frequentemente chega ao fim do primeiro ano próximo de 75 cm, embora a avaliação individual deva ser feita pela curva.

---

# 17. Crescimento na puberdade

A puberdade produz aceleração temporária do crescimento.

## Meninas

O estirão tende a ocorrer mais cedo, em Tanner mamário **M2–M3**, com velocidade aproximada de **8–10 cm/ano**.

Depois da menarca, a menina ainda costuma crescer alguns centímetros. A SBP cita média próxima de **5–6 cm**.

## Meninos

O estirão é mais tardio, geralmente em **G3–G4**, com velocidade de **10–12 cm/ano**.

> **PEGADINHA**
>
> “Entrou na puberdade, então vai recuperar qualquer baixa estatura” é falso. O estirão acelera o crescimento, mas não necessariamente corrige uma trajetória patológica prévia.

---

# 18. Canal familiar / altura-alvo

A altura-alvo estima o potencial genético de estatura final.

## Fórmulas

| Sexo | Fórmula |
|---|---|
| Menino | (altura do pai + altura da mãe + 13 cm) / 2 |
| Menina | (altura do pai + altura da mãe − 13 cm) / 2 |

A SBP utiliza uma faixa prática de aproximadamente **±5 cm** ao redor do resultado.

### Exemplo

Pai 175 cm e mãe 165 cm, menino:

    (175 + 165 + 13) / 2 = 176,5 cm

Faixa aproximada:

    171,5–181,5 cm

### Limitações

A fórmula não é “destino genético absoluto”. Se os próprios pais tiveram doença que comprometeu crescimento, usar suas alturas pode subestimar o potencial do filho.

> **PROVA**
>
> Baixa estatura não deve ser analisada sem altura dos pais.

---

# 19. Idade óssea

A idade óssea estima a maturação esquelética, geralmente por radiografia de mão e punho.

Ela ajuda a responder:

- a maturação está atrasada?
- está adequada à idade cronológica?
- está avançada?
- quanto potencial de crescimento ainda existe?

## Interpretação prática

| Situação | Idade óssea frequente |
|---|---|
| Baixa estatura familiar | próxima da idade cronológica |
| Atraso constitucional | atrasada |
| Hipotireoidismo | frequentemente atrasada |
| Deficiência de GH | frequentemente atrasada |
| Puberdade precoce | avançada |

Idade óssea nunca deve ser interpretada sozinha.

---

# 20. Baixa estatura

A SBP define:

- **estatura normal:** entre P2,5 e P97,5;
- **baixa estatura:** < P2,5;
- **alta estatura:** > P97,5;
- **zonas de vigilância:** P2,5–P10 e P90–P97,5.

Uma criança pode ser baixa e saudável. O problema maior é:

- baixa estatura + baixa velocidade;
- queda progressiva de canal;
- discrepância com altura-alvo;
- sintomas ou sinais sistêmicos.

## Perguntas essenciais

1. Sempre foi baixa?
2. Está caindo na curva?
3. Cresce quantos cm/ano?
4. Pais são baixos?
5. A puberdade está adequada?
6. Peso também caiu?
7. Há doença crônica?
8. Há desproporção?
9. Há dismorfias?
10. Nasceu pequeno para idade gestacional?

---

# 21. Variantes normais da baixa estatura

## Baixa estatura familiar

Perfil típico:

- pais baixos;
- canal familiar baixo;
- criança saudável;
- velocidade de crescimento preservada;
- puberdade em época habitual;
- idade óssea aproximadamente compatível.

## Atraso constitucional do crescimento e puberdade

Perfil típico:

- criança ou adolescente baixo;
- velocidade geralmente preservada;
- história familiar de puberdade tardia;
- idade óssea atrasada;
- puberdade atrasada;
- tendência a atingir estatura final compatível com genética mais tarde.

| Característica | Familiar | Constitucional |
|---|---|---|
| Pais baixos | frequente | pode não ocorrer |
| Velocidade | normal | normal |
| Idade óssea | próxima da cronológica | atrasada |
| Puberdade | habitual | atrasada |
| Estatura final | baixa, compatível com família | tende a recuperar dentro do potencial genético |

---

# 22. Sinais de alerta no crescimento

Investigue com mais cuidado se houver:

- estatura < P2,5;
- escore-Z muito baixo;
- cruzamento descendente de canais;
- velocidade abaixo do esperado;
- discrepância importante com altura-alvo;
- baixa estatura desproporcionada;
- microcefalia;
- dismorfias;
- anomalias congênitas;
- atraso puberal importante;
- puberdade precoce;
- doença crônica;
- sintomas gastrointestinais persistentes;
- sinais de hipotireoidismo;
- uso crônico de corticoide;
- pequeno para idade gestacional sem catch-up adequado.

A SBP destaca especialmente discrepância importante em relação ao alvo familiar, anomalias congênitas, dismorfismos, baixa estatura desproporcionada, microcefalia, deficiência intelectual e criança PIG sem recuperação adequada como situações que merecem atenção especializada.

---

# 23. Exames iniciais na criança com baixa estatura

Não existe “painel obrigatório” idêntico para todos. A história e o exame direcionam.

Exames frequentemente considerados:

| Exame | O que procura |
|---|---|
| Hemograma | anemia, doença crônica |
| Função renal | doença renal crônica |
| Função hepática | doença sistêmica |
| Eletrólitos | distúrbios metabólicos |
| TSH e T4 livre | hipotireoidismo |
| VHS/PCR | inflamação crônica quando suspeita |
| Antitransglutaminase IgA + IgA total | doença celíaca |
| Urina | doença renal |
| Idade óssea | maturação esquelética |

### E o GH?

**Não peça GH basal para rastrear baixa estatura.**

A secreção de GH é pulsátil. Quando houver suspeita de deficiência, a investigação endocrinológica pode envolver:

- IGF-1;
- IGFBP-3;
- testes de estímulo;
- avaliação do eixo hipotálamo-hipofisário.

> **PEGADINHA CLÁSSICA DE RESIDÊNCIA**
>
> Criança baixa, saudável, com velocidade preservada → não pule direto para teste de GH.

---

# 24. Crescimento do prematuro

Prematuros precisam ser interpretados com referencial apropriado.

Durante o período próximo ao termo, podem ser usadas curvas específicas, como Intergrowth/Fenton conforme protocolo.

Depois, utiliza-se **idade corrigida** para interpretar crescimento por determinado período.

### Fórmula prática

    idade corrigida = idade cronológica − semanas que faltaram para 40 semanas

Exemplo:

- nasceu com 32 semanas;
- faltaram 8 semanas para 40;
- aos 4 meses cronológicos, idade corrigida ≈ 2 meses.

> **IMPORTANTE**
>
> Aqui estamos falando de **crescimento**. A parte detalhada de DNPM do prematuro ficará na apostila específica de desenvolvimento.

---

# 25. Vitamina D e ferro na puericultura

## Vitamina D

Nas suas anotações:

| Idade | Profilaxia registrada |
|---|---:|
| <1 ano | 400 UI/dia |
| 1–18 anos | 600 UI/dia |

Situações de risco podem exigir doses maiores, individualizadas.

A finalidade principal é prevenir deficiência e raquitismo e preservar saúde óssea.

## Ferro

Suas anotações registram atenção especial aos prematuros e crianças com baixo peso ao nascer.

A profilaxia depende de:

- idade gestacional;
- peso ao nascer;
- alimentação;
- presença de anemia;
- diretriz vigente.

Como os esquemas podem sofrer atualização, o material do app deve sempre confrontar a dose com a recomendação pediátrica mais recente antes de usar como prescrição.

---

# 26. Como interpretar uma curva na prática

Use sempre a mesma sequência:

## Passo 1 — confirme os dados

- sexo;
- data de nascimento;
- idade;
- prematuridade;
- Tanner.

## Passo 2 — confira a técnica

- equipamento;
- posição;
- roupa;
- método de comprimento/estatura;
- unidade.

## Passo 3 — plote o indicador correto

Não misture:

- peso/idade;
- estatura/idade;
- peso/estatura;
- IMC/idade.

## Passo 4 — olhe a trajetória

Pergunte:

- acompanha o mesmo canal?
- cruzou percentis?
- acelerou?
- desacelerou?

## Passo 5 — calcule a velocidade

Compare com valores esperados para a faixa etária e estágio puberal.

## Passo 6 — compare com a família

Calcule altura-alvo.

## Passo 7 — procure contexto clínico

- doença;
- dieta;
- medicamentos;
- puberdade;
- sintomas sistêmicos.

## Passo 8 — decida

- manter seguimento;
- repetir medida;
- reduzir intervalo entre consultas;
- solicitar investigação;
- encaminhar.

---

# 27. Casos rápidos de interpretação

## Caso 1 — criança pequena, mas estável

Menino no P3 desde pequeno, pais baixos, cresce 5–6 cm/ano antes da puberdade, exame normal.

**Interpretação:** provável variante familiar. O P3 sozinho não determina doença.

## Caso 2 — criança “normal”, mas caindo

Menina estava no P75 e em dois anos caiu progressivamente para P25.

**Interpretação:** apesar de ainda estar em faixa “normal”, a trajetória é anormal e precisa ser esclarecida.

## Caso 3 — aceleração inesperada

Criança de 7 anos sai de P50 para P90 rapidamente e apresenta sinais puberais.

**Interpretação:** crescimento acelerado pode indicar puberdade precoce.

## Caso 4 — baixa estatura com peso preservado

Criança baixa, desaceleração da estatura, peso relativamente preservado.

**Interpretação:** pense em causa endócrina, entre outras.

## Caso 5 — peso cai antes da estatura

Criança com diarreia crônica, queda ponderal e só depois queda de estatura.

**Interpretação:** doença nutricional/sistêmica deve ser investigada.

---

# 28. Pegadinhas de residência

### 1. “Percentil 3 = doença”

Falso. Percentil baixo pode ser normal quando trajetória, velocidade e canal familiar são adequados.

### 2. “Está entre -2 e +2, então está tudo bem”

Falso. A criança pode estar cruzando canais rapidamente.

### 3. “GH baixo em coleta aleatória confirma deficiência”

Falso. GH é pulsátil.

### 4. “Na puberdade toda baixa estatura recupera”

Falso. O estirão acelera crescimento, mas não corrige automaticamente trajetória patológica.

### 5. “Menarca encerra crescimento”

Falso. A SBP cita crescimento médio adicional de alguns centímetros, em torno de 5–6 cm.

### 6. “Crescimento acelerado é sempre bom”

Falso. Pode ser sinal de puberdade precoce ou outras alterações.

### 7. “Idade óssea atrasada = deficiência de GH”

Falso. Também ocorre no atraso constitucional e em outras condições.

---

# 29. Tabela de revisão rápida

| Tema | Informação-chave |
|---|---|
| Puericultura | cuidado preventivo e longitudinal |
| Peso neonatal | pode perder até ~10% nos primeiros dias |
| Recuperação | aproximadamente até 10–14 dias |
| Peso 4–5 meses | aproximadamente dobra |
| Peso 12 meses | aproximadamente triplica |
| Crescimento 1º ano | ~25 cm |
| 1–2 anos | 10–13 cm/ano |
| 2–4 anos | ~7 cm/ano |
| 4–6 anos | ~6 cm/ano |
| Pré-puberal | ~5 cm/ano |
| Estirão feminino | 8–10 cm/ano |
| Estirão masculino | 10–12 cm/ano |
| Meninas | estirão em M2–M3 |
| Meninos | estirão em G3–G4 |
| Estatura normal SBP | P2,5–P97,5 |
| Baixa estatura SBP | <P2,5 |
| Comprimento vs. altura | diferença aproximada de 0,7 cm |
| Altura-alvo menino | (pai + mãe + 13)/2 |
| Altura-alvo menina | (pai + mãe − 13)/2 |
| Faixa do alvo | aproximadamente ±5 cm |

---

# 30. Checklist final da questão

Antes de responder qualquer questão de crescimento:

- [ ] A medida foi confirmada?
- [ ] A idade está correta?
- [ ] É prematuro?
- [ ] A curva é a correta?
- [ ] Qual o escore-Z/percentil?
- [ ] Como está a trajetória?
- [ ] Qual a velocidade?
- [ ] Qual o estágio de Tanner?
- [ ] Qual a altura-alvo?
- [ ] Peso e estatura caíram juntos?
- [ ] Há doença crônica?
- [ ] Há dismorfia ou desproporção?
- [ ] Há sintomas de hipotireoidismo ou doença gastrointestinal?
- [ ] Precisa idade óssea?
- [ ] Precisa investigação ou apenas seguimento?

---

# Síntese de alto rendimento

**Puericultura é longitudinal.** Não é uma fotografia da criança naquele dia.

**Crescimento normal é harmônico e tende a seguir um canal.** O dado mais valioso é a trajetória.

**Velocidade importa mais do que percentil isolado.**

**Baixa estatura pode ser normal; queda de velocidade não deve ser banalizada.**

**Altura dos pais é parte do exame de crescimento.**

**Puberdade muda a velocidade de crescimento.**

**Erro antropométrico pode fabricar doença.**

**Antes de pedir GH, leia a curva.**
`,
  criadoEm: agora,
  atualizadoEm: agora,
  revisadoEm: agora,
};
