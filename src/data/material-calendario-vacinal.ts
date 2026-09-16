import type { Material } from "@/lib/conteudo";

const agora = "2026-09-14T00:00:00.000Z";

export const MATERIAL_CALENDARIO_VACINAL: Material = {
  id: "material-pediatria-calendario-vacinal-2026",
  titulo: "Calendário Vacinal",
  subtitulo:
    "Apostila de Pediatria baseada no PNI 2026: calendário por idade, atualização VPC20, rotavírus, influenza, covid-19, febre amarela, vacinação do adolescente, atrasos e situações especiais.",
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
      titulo: "Calendário Nacional de Vacinação 2026 — Criança",
      ano: 2026,
      referencia: "Ministério da Saúde — atualização de 29/07/2026",
    },
    {
      tipo: "guideline",
      titulo: "Calendário Técnico Nacional de Vacinação / Instrução Normativa 2026",
      ano: 2026,
      referencia: "Programa Nacional de Imunizações — Ministério da Saúde",
    },
    {
      tipo: "guideline",
      titulo: "Guia Técnico para introdução da vacina pneumocócica 20-valente no PNI",
      ano: 2026,
      referencia: "Ministério da Saúde",
    },
    {
      tipo: "guideline",
      titulo: "Calendário Nacional de Vacinação 2026 — Adolescente e Jovem",
      ano: 2026,
      referencia: "Ministério da Saúde",
    },
    {
      tipo: "guideline",
      titulo: "Calendário de Vacinação da SBP — atualização 2025/2026",
      ano: 2026,
      referencia: "Sociedade Brasileira de Pediatria — comparação complementar",
    },
    {
      tipo: "guideline",
      titulo: "Calendário de Vacinação SBIm Criança 2026/2027",
      ano: 2026,
      referencia: "Sociedade Brasileira de Imunizações — comparação complementar",
    },
  ],
  imagens: [],
  pontosProva: [
    "Esquema atrasado não deve ser reiniciado: aproveite doses válidas e complete o que falta.",
    "PNI 2026: VPC20 entrou no SUS; durante a transição, 2 meses = VPC20, 4 meses = VPC10 e 12 meses = reforço VPC20.",
    "Rotavírus: D1 pode ser feita de 1m15d a 11m29d; D2 de 3m15d a 23m29d. Se a D1 não ocorrer na janela permitida, perde-se a oportunidade da vacinação.",
    "Poliomielite na rotina atual é VIP: 2, 4 e 6 meses, com reforços aos 15 meses e 4 anos. VOP não é a rotina atual do PNI.",
    "Aos 12 meses: VPC20 reforço + MenACWY + tríplice viral D1.",
    "Aos 15 meses: DTP reforço + VIP reforço + SCR D2 + varicela D1 + hepatite A.",
    "Influenza é anual dos 6 meses aos menores de 6 anos; na primeira vacinação, são 2 doses com 30 dias de intervalo.",
    "Febre amarela: rotina aos 9 meses e reforço aos 4 anos; entre 6–8 meses somente em situações de alto risco epidemiológico após avaliação.",
    "BCG: dose única; RN <2 kg deve aguardar atingir 2 kg; ausência de cicatriz não indica revacinação.",
    "HPV4: 1 dose na rotina entre 9 e 14 anos; MenACWY: 1 dose entre 11 e 14 anos.",
  ],
  conteudo: String.raw`# Calendário Vacinal

## Visão geral

Calendário vacinal é um tema em que **decorar a tabela é necessário, mas não suficiente**. As provas também cobram criança com esquema atrasado, limites etários, contraindicações verdadeiras, situações especiais e diferenças entre o Programa Nacional de Imunizações (PNI) e calendários de sociedades médicas.

As anotações de aula são a base deste capítulo, mas o calendário abaixo foi atualizado para o **PNI vigente em 2026**, incluindo mudanças recentes como a introdução da pneumocócica 20-valente e a ampliação das janelas do rotavírus.

> **IDEIA CENTRAL**
>
> Em uma questão de vacina, responda sempre quatro perguntas: **qual a idade? o que já recebeu? qual fonte a banca está usando? existe alguma condição especial?**

> **ATUALIZAÇÃO 2026**
>
> Algumas regras clássicas de materiais antigos mudaram. Entre as mais importantes: a rotina da pólio passou a ser feita com **VIP**, a pneumocócica está em transição para **VPC20**, o rotavírus tem janelas etárias mais amplas e a influenza integra a rotina anual das crianças de 6 meses a menores de 6 anos.

---

# 1. Tabela-mestra do PNI 2026

Esta é a tabela que deve orientar o raciocínio quando a questão pedir **Calendário Nacional de Vacinação / Ministério da Saúde / PNI**.

| Idade | Vacinas de rotina | O que mais cai |
|---|---|---|
| Ao nascer | BCG + hepatite B | BCG dose única; HB neonatal |
| 2 meses | Penta D1 + VIP D1 + rotavírus D1 + VPC20 D1 | início do esquema primário; VPC20 é novidade de 2026 |
| 3 meses | MenC D1 | meningocócica C |
| 4 meses | Penta D2 + VIP D2 + rotavírus D2 + VPC10 D2 durante transição | esquema misto VPC20/VPC10 é oficial na transição |
| 5 meses | MenC D2 | completa esquema básico MenC |
| 6 meses | Penta D3 + VIP D3 + início covid-19 conforme produto; influenza a partir desta idade | influenza anual; covid depende do produto/esquema vigente |
| 9 meses | Febre amarela D1 | 6–8 meses somente em alto risco epidemiológico |
| 12 meses | VPC20 reforço + MenACWY + SCR D1 | “trinca” muito cobrada no primeiro aniversário |
| 15 meses | DTP R1 + VIP R1 + SCR D2 + varicela D1 + hepatite A | reforços + vacinas virais |
| 4 anos | DTP R2 + VIP R2 + varicela D2 + febre amarela reforço | segundo bloco de reforços |
| 5 anos | VPC20 somente para povos indígenas sem histórico de pneumo conjugada | não é rotina universal para toda criança de 5 anos |
| 9 anos | HPV4 1 dose | rotina 9–14 anos; atraso até 14a11m29d |

> **ATENÇÃO — PNEUMOCÓCICA EM TRANSIÇÃO**
>
> Em 2026, o PNI iniciou a substituição gradual da VPC10 pela **VPC20**. Durante a transição: **2 meses VPC20 → 4 meses VPC10 → 12 meses VPC20**. Isso não é erro de digitação nem mistura inadequada: é a orientação oficial enquanto houver estoque da VPC10.

---

# 2. Como memorizar sem decorar uma lista solta

A melhor forma é pensar em blocos.

### Nascimento: “BB”

**B**CG + hepatite **B**.

### 2 e 4 meses: núcleo de quatro vacinas

- penta;
- VIP;
- rotavírus;
- pneumocócica conjugada.

Nas suas anotações aparecia o macete **“4P”**: Penta, Pólio, Pneumo e “Piriri” para rotavírus. Ele continua útil, mas em 2026 lembre que a pneumocócica está em transição para VPC20.

### 3 e 5 meses

Meningocócica C.

### 6 meses

Fecha penta + VIP do esquema básico e entram as vacinas sazonais/atuais conforme indicação: influenza a partir de 6 meses e covid-19 conforme esquema vigente.

### 12 meses

**Pneumo + Meningo ACWY + Tríplice viral.**

### 15 meses

Pense em **reforçar bactérias/pólio e completar virais**: DTP, VIP, SCR, varicela e hepatite A.

### 4 anos

Novo bloco de reforços: DTP, VIP, varicela e febre amarela.

> **COMO CAI NA RESIDÊNCIA**
>
> A banca frequentemente apresenta uma criança hígida com idade exata e pergunta “qual vacina deve receber hoje?”. Antes de olhar alternativas, reconstrua mentalmente o bloco daquela idade.

---

# 3. Ao nascer: BCG e hepatite B

## BCG

A BCG é uma vacina viva atenuada derivada do **Mycobacterium bovis**. Seu objetivo principal não é impedir toda infecção tuberculosa, mas reduzir especialmente o risco das **formas graves de tuberculose na infância, como miliar e meníngea**.

No PNI, é dose única, preferencialmente ao nascer. Na rotina, pode ser administrada até **4 anos, 11 meses e 29 dias** quando indicada.

### Peso ao nascer

Recém-nascido com peso **<2 kg** deve ter a BCG adiada até atingir 2 kg.

### Cicatriz

A reação local evolutiva é esperada. O ponto decisivo para prova é:

> **DECORE**
>
> **Ausência de cicatriz de BCG não é indicação de revacinação.**

## Hepatite B

A dose monovalente deve ser feita ao nascer, idealmente o mais precocemente possível. Depois, a criança recebe antígeno contra hepatite B nas doses da pentavalente aos 2, 4 e 6 meses.

### Mãe HBsAg positiva

O recém-nascido exposto deve receber **vacina hepatite B + imunoglobulina humana anti-hepatite B** no pós-parto imediato, conforme protocolo do PNI.

> **PEGADINHA**
>
> Não escolha entre vacina e imunoglobulina no RN de mãe HBsAg positiva: a profilaxia combina **imunização ativa + passiva**.

---

# 4. Dois, quatro e seis meses: o núcleo do esquema básico

## Pentavalente

A penta do PNI protege contra:

1. difteria;
2. tétano;
3. coqueluche;
4. Haemophilus influenzae tipo b;
5. hepatite B.

Esquema básico: **2, 4 e 6 meses**.

A presença do componente pertussis de células inteiras explica maior reatogenicidade em comparação com formulações acelulares. Situações especiais podem levar ao uso de DTPa em serviços de referência, mas isso não transforma DTPa na vacina de rotina universal do SUS.

## Poliomielite — VIP

O calendário atual utiliza vacina poliomielite inativada (**VIP**):

- 2 meses;
- 4 meses;
- 6 meses;
- reforço aos 15 meses;
- reforço aos 4 anos.

> **ATUALIZAÇÃO IMPORTANTE**
>
> Materiais antigos podem mostrar VOP nos reforços. Para a rotina atual do PNI, pense em **VIP**. A VOP é uma vacina viva oral historicamente importante, mas não deve ser marcada como esquema rotineiro atual da criança.

## Rotavírus

Rotina: D1 aos 2 meses e D2 aos 4 meses. O que tornou essa vacina especialmente importante para prova em 2026 são as novas janelas etárias.

| Dose | Idade de rotina | Janela permitida no PNI 2026 |
|---|---:|---:|
| D1 | 2 meses | 1 mês e 15 dias até 11 meses e 29 dias |
| D2 | 4 meses | 3 meses e 15 dias até 23 meses e 29 dias |

Intervalo recomendado entre doses: **60 dias**. Em situações excepcionais, o mínimo pode ser **30 dias**.

Se a primeira dose não for administrada dentro da janela permitida, a criança perde a oportunidade da vacinação contra rotavírus.

### Contraindicação clássica

Antecedente de **invaginação intestinal** é um ponto clássico de contraindicação. Também existem situações especiais gastrointestinais e de imunodeficiência que devem ser avaliadas conforme manual do PNI/CRIE.

> **ATENÇÃO**
>
> Não use automaticamente os limites antigos de 3 meses e 15 dias para D1 e 7 meses e 29 dias para D2. O PNI ampliou as janelas.

---

# 5. Pneumocócica: a grande atualização de 2026

A vacina pneumocócica conjugada previne doença pneumocócica invasiva, incluindo bacteremia, meningite e pneumonias por sorotipos contemplados.

## O que mudou

Em 2026, a **VPC20** foi incorporada ao calendário infantil do SUS, ampliando a cobertura de sorotipos. A implantação ocorre com transição gradual do estoque de VPC10.

### Esquema durante a transição

1. **2 meses: VPC20 — D1**;
2. **4 meses: VPC10 — D2**;
3. **12 meses: VPC20 — reforço**.

Após o esgotamento da VPC10, o PNI passará a utilizar VPC20 conforme o esquema operacional vigente.

> **PEGADINHA DE ATUALIZAÇÃO**
>
> Questão de 2026 com VPC20 aos 2 meses, VPC10 aos 4 e VPC20 aos 12 **não está errada**. Esse é o esquema de transição definido pelo Ministério da Saúde.

### Criança de 5 anos

A dose de VPC20 aos 5 anos no calendário nacional não significa vacinação universal de toda criança dessa idade. Ela está indicada, nesse ponto do calendário, **para povos indígenas sem histórico de vacina pneumocócica conjugada**.

---

# 6. Três, cinco e doze meses: meningocócicas

No PNI:

- 3 meses: MenC D1;
- 5 meses: MenC D2;
- 12 meses: reforço com **MenACWY**.

A MenACWY amplia a proteção para os sorogrupos A, C, W e Y.

> **DECORE**
>
> O primeiro aniversário não recebe mais apenas “reforço de meningocócica C”: no calendário atual, o reforço é feito com **MenACWY**.

Na rede privada e nos calendários de sociedades médicas, esquemas com MenACWY desde o primeiro ano e vacinação contra meningococo B podem ser recomendados. Isso é diferente do calendário público de rotina.

---

# 7. A partir dos 6 meses: influenza e covid-19

## Influenza

No PNI 2026, crianças de **6 meses a menores de 6 anos** devem ser vacinadas anualmente.

### Primeira vacinação contra influenza

Se a criança nunca recebeu influenza anteriormente:

- D1;
- D2 após **30 dias**.

Nas temporadas seguintes, recebe uma dose anual.

Para crianças indígenas e crianças com determinadas comorbidades, há recomendações específicas que podem abranger faixas etárias maiores.

> **PEGADINHA**
>
> “Influenza é só campanha” está errado. Ela integra a **rotina** para os grupos definidos pelo PNI.

### Alergia a ovo

Alergia a ovo não deve ser tratada como contraindicação absoluta automática à influenza. A avaliação depende do histórico de reação e das recomendações vigentes de segurança vacinal.

## Covid-19

A vacinação contra covid-19 integra o calendário infantil a partir dos 6 meses. O número de doses e intervalos dependem do produto disponível e da situação clínica.

No calendário técnico de 2026, há esquemas com produtos de RNAm diferentes. Em questão que peça detalhe de intervalo/produto, use o produto descrito no enunciado e a norma vigente, em vez de decorar um único esquema para todas as apresentações.

---

# 8. Febre amarela

Na rotina da criança:

- **9 meses: primeira dose**;
- **4 anos: reforço**.

## Situação excepcional entre 6 e 8 meses

Pode ser recomendada quando há **alto risco epidemiológico**, como residência ou viagem inevitável para área com circulação viral comprovada, após avaliação do serviço de saúde.

> **ATENÇÃO**
>
> A dose de 6–8 meses não deve ser transformada em rotina universal. A rotina permanece aos 9 meses.

A vacina é viva atenuada. Por isso, situações como gestação, imunodepressão e lactação exigem avaliação específica de risco-benefício conforme o contexto epidemiológico e as normas do PNI.

---

# 9. Doze meses: o primeiro aniversário

Aos 12 meses, pense em três vacinas principais:

1. **VPC20 — reforço**;
2. **MenACWY — reforço/proteção ampliada**;
3. **tríplice viral (SCR) — D1**.

A tríplice viral protege contra sarampo, caxumba e rubéola.

> **MACETE**
>
> “12 = Pneumo + Meningo + Tríplice”. É um bloco curto e de alto rendimento.

---

# 10. Quinze meses: reforços e virais

Aos 15 meses:

- DTP — 1º reforço;
- VIP — 1º reforço;
- tríplice viral — D2;
- varicela — D1;
- hepatite A — dose única.

Em caso de indisponibilidade da varicela monovalente, a **tetraviral** pode ser utilizada conforme orientação do PNI.

> **ATUALIZAÇÃO**
>
> Em anotações e calendários antigos é comum ver “tetraviral + VOP” como associação clássica dos 15 meses. No calendário atual, a pólio é reforçada com **VIP**, e o PNI explicita SCR D2 + varicela D1, podendo usar tetraviral quando a monovalente não estiver disponível.

---

# 11. Quatro, cinco e nove anos

## 4 anos

- DTP — 2º reforço;
- VIP — 2º reforço;
- varicela — D2;
- febre amarela — reforço.

## 5 anos

VPC20 somente para **povos indígenas** sem histórico de pneumocócica conjugada. Não é uma dose universal de rotina para todas as crianças de 5 anos.

## 9 anos

HPV4 — **1 dose**.

A rotina é para meninas e meninos entre 9 e 14 anos, conforme histórico vacinal. Em atraso, deve-se vacinar até 14 anos, 11 meses e 29 dias. Estratégias de resgate em 15–19 anos podem existir conforme definição vigente e não devem ser confundidas com rotina universal permanente.

---

# 12. Adolescente: o que precisa saber

| Faixa | Vacina | Esquema principal no PNI 2026 |
|---|---|---|
| 9–14 anos | HPV4 | 1 dose conforme histórico |
| 10–14 anos | Dengue tetravalente | 2 doses com intervalo de 3 meses, conforme estratégia do PNI |
| 11–14 anos | MenACWY | 1 dose |
| 10–24 anos | Hepatite B | completar 3 doses conforme histórico |
| 10–24 anos | dT | completar esquema de 3 doses e reforços conforme histórico |
| 10–24 anos | Febre amarela | conforme histórico/indicação epidemiológica |
| 10–24 anos | Tríplice viral | completar 2 doses conforme histórico |

Varicela e pneumocócicas têm indicações específicas no PNI para determinados grupos; não marque essas vacinas como rotina universal de todo adolescente sem ler o enunciado.

## Dengue

No calendário de 2026, a vacina dengue tetravalente é indicada na estratégia do PNI para a faixa de **10 a 14 anos**, em duas doses com intervalo de 3 meses. O candidato deve observar as regras operacionais e o público definido na questão, pois a estratégia pode ser ajustada pelo programa.

---

# 13. Vacinas vivas, inativadas e vias

Entender a plataforma ajuda a resolver contraindicações.

| Grupo | Exemplos importantes | Via típica |
|---|---|---|
| Vivas atenuadas | BCG, rotavírus, febre amarela, SCR, varicela | BCG ID; rotavírus oral; várias virais SC |
| Inativadas/recombinantes/conjugadas | VIP, influenza, hepatite B, HPV, pneumocócicas, meningocócicas | predominantemente IM |
| Toxoides | difteria e tétano em DTP/dT/dTpa | IM |

> **CONCEITO-CHAVE**
>
> A preocupação maior com vacinas vivas é a possibilidade de replicação do agente atenuado em pessoas com imunodepressão importante e o uso durante a gestação. Mas contraindicações devem ser analisadas **vacina por vacina e situação por situação**, não por uma regra simplificada.

---

# 14. Contraindicações verdadeiras, adiamentos e falsas contraindicações

## Contraindicações gerais importantes

- anafilaxia comprovada após dose anterior ou a componente relevante da vacina;
- vacinas vivas em determinadas imunodeficiências/imunossupressões importantes;
- vacinas vivas durante a gestação, salvo orientações excepcionais específicas de risco-benefício quando previstas pelo programa;
- contraindicações específicas de cada imunobiológico, como antecedente de invaginação intestinal para rotavírus.

## Quando pode ser necessário adiar

Doença aguda moderada ou grave, especialmente com febre importante, pode justificar adiamento até melhora. Uso de imunossupressores e corticoide sistêmico em dose imunossupressora também exige avaliação do tipo de vacina e do intervalo adequado.

## Falsas contraindicações clássicas

Em geral, não devem impedir automaticamente a vacinação:

- resfriado/doença leve;
- uso de antibiótico por infecção leve;
- prematuridade, salvo particularidades específicas;
- desnutrição sem situação clínica que contraindique;
- amamentação para a maioria das vacinas;
- história familiar de evento adverso;
- alergia não anafilática inespecífica;
- alergia a ovo como contraindicação absoluta automática à influenza.

> **COMO CAI**
>
> A banca oferece uma criança com coriza leve, sem comprometimento geral, e pergunta se deve “perder a oportunidade vacinal”. Em geral, doença leve não é motivo para adiar automaticamente.

---

# 15. Imunoglobulinas, hemoderivados e vacinas vivas

Imunoglobulinas fornecem anticorpos prontos: produzem proteção rápida, porém **passiva** e temporária.

Alguns produtos contendo anticorpos podem interferir com a resposta a determinadas vacinas vivas parenterais. O intervalo necessário varia conforme:

- produto administrado;
- dose;
- via;
- vacina que será aplicada.

> **ATENÇÃO**
>
> Não decore “um intervalo universal” entre qualquer imunoglobulina e qualquer vacina viva. Para prova detalhada, siga a tabela específica do Manual do PNI/CRIE.

Vacinas inativadas não sofrem a mesma interferência por replicação viral e, em geral, podem ser administradas sem a mesma necessidade de espaçamento.

---

# 16. Prematuros

A regra geral é simples:

> **REGRA DE OURO**
>
> Prematuro é vacinado pela **idade cronológica**, e não pela idade corrigida.

Existem exceções e particularidades.

### BCG

Se peso <2 kg, aguarde atingir 2 kg.

### Internação prolongada

Vacinas vivas orais e situações de UTI neonatal podem exigir planejamento específico por risco de eliminação do agente vacinal e características do paciente. O CRIE/RIE deve ser considerado quando houver prematuridade extrema, comorbidades ou indicação de imunobiológicos especiais.

### Hepatite B

Recém-nascidos prematuros e/ou de baixo peso podem ter esquemas específicos dependendo de peso, idade gestacional e situação materna. Em prova, não aplique automaticamente uma regra de criança a termo quando o enunciado trouxer prematuridade importante.

---

# 17. Esquema atrasado: como raciocinar

O erro mais comum é querer “começar tudo de novo”.

> **DECORE**
>
> **Vacina atrasada não zera memória imunológica. Não reinicie esquemas apenas porque o intervalo ficou longo.**

## Passo a passo

1. Confirme a idade atual.
2. Veja o cartão e identifique doses documentadas.
3. Determine quais doses foram válidas.
4. Veja se a vacina ainda é indicada para a idade atual.
5. Respeite intervalos mínimos entre as doses restantes.
6. Complete o esquema sem repetir doses desnecessariamente.
7. Procure regras especiais para vacinas com limite etário, principalmente rotavírus.

### Por que rotavírus é diferente?

Porque existe **janela máxima** para iniciar/administrar as doses. Não basta dizer “está atrasado, então completo quando puder”.

### Criança sem cartão

A ausência do cartão não deve impedir avaliação e vacinação indicada. O serviço deve tentar recuperar registros disponíveis e conduzir conforme normas do PNI.

---

# 18. DTP, DTPa, dT e dTpa sem confusão

| Sigla | Ideia principal |
|---|---|
| DTP | tríplice bacteriana infantil, componente pertussis de células inteiras |
| DTPa | tríplice bacteriana acelular infantil; usada em situações específicas/CRIE e rede privada |
| dT | dupla adulto: difteria + tétano |
| dTpa | difteria + tétano + pertussis acelular para faixas/indicações específicas, especialmente gestação |

Eventos importantes após componente pertussis podem modificar o imunobiológico das doses seguintes, devendo-se seguir critérios do PNI/CRIE. Não transforme toda febre ou reação local após DTP em contraindicação à próxima dose.

---

# 19. Gestação e proteção do lactente

Embora este capítulo seja pediátrico, a proteção do bebê começa antes do nascimento.

## Vacina contra VSR

No SUS, em 2026, a vacina recombinante contra o vírus sincicial respiratório é recomendada para **todas as gestantes a partir de 28 semanas**, em **dose única a cada gestação**. Os anticorpos maternos atravessam a placenta e ajudam a proteger o lactente nos primeiros meses, período de maior risco de formas graves de VSR.

## dTpa

A vacinação materna com dTpa é fundamental para transferência de anticorpos contra coqueluche ao recém-nascido e segue o calendário específico da gestante.

> **CONCEITO-CHAVE**
>
> Vacinação materna é estratégia de proteção pediátrica por **imunidade passiva transplacentária**.

---

# 20. PNI x SBP/SBIm e rede privada

Uma questão pode estar correta em um calendário e errada em outro. Sempre identifique a fonte.

O PNI define a rotina do SUS e prioriza estratégias populacionais. SBP e SBIm podem recomendar proteção mais ampla em alguns pontos, por exemplo:

- meningocócica B;
- uso mais amplo de MenACWY;
- diferentes vacinas pneumocócicas conjugadas conforme disponibilidade e faixa etária;
- esquemas de rotavírus que variam conforme o produto;
- outras estratégias para influenza, dengue e grupos especiais.

> **PEGADINHA DE PROVA**
>
> Se o enunciado disser “segundo o PNI”, não marque automaticamente a alternativa que corresponde ao calendário da clínica privada. Se disser “segundo SBP/SBIm”, não limite a resposta ao que o SUS oferece.

---

# 21. O que mais cai em prova

1. calendário por idade, especialmente 2, 4, 6, 12, 15 meses e 4 anos;
2. rotavírus e limites etários;
3. não reiniciar esquema atrasado;
4. BCG em RN <2 kg e ausência de cicatriz;
5. hepatite B + imunoglobulina no RN de mãe HBsAg positiva;
6. diferença entre DTP, DTPa, dT e dTpa;
7. vacinas vivas em imunodeprimidos/gestantes;
8. falsas contraindicações;
9. MenACWY aos 12 meses e 11–14 anos;
10. HPV em dose única;
11. VIP como rotina atual da poliomielite;
12. VPC20 e esquema transitório de 2026;
13. influenza anual a partir de 6 meses até menores de 6 anos;
14. diferença entre PNI e calendários de sociedades.

---

# Casos rápidos de interpretação

## Caso 1 — calendário atrasado

Criança de 10 meses recebeu penta e VIP aos 2 e 4 meses, mas faltou às consultas seguintes. A mãe pergunta se precisa começar tudo novamente.

**Interpretação:** não. Doses válidas anteriores são aproveitadas. Deve-se atualizar o esquema conforme idade, doses já recebidas e intervalos mínimos.

## Caso 2 — rotavírus nunca iniciado

Criança de 1 ano e 2 meses nunca recebeu rotavírus.

**Interpretação:** ultrapassou a janela para D1, que vai até 11 meses e 29 dias. Não se inicia o esquema nessa idade.

## Caso 3 — pneumo “misturada”

Lactente recebeu VPC20 aos 2 meses e chega aos 4 meses; a UBS oferece VPC10.

**Interpretação:** em 2026, isso pode estar correto. Durante a transição do PNI, o esquema prevê VPC20 aos 2 meses, VPC10 aos 4 e reforço VPC20 aos 12 meses.

## Caso 4 — adolescente

Menino de 12 anos nunca recebeu HPV e não tem registro de MenACWY.

**Interpretação:** está na faixa de rotina para HPV4 em dose única e MenACWY em uma dose, além de revisar todo o histórico vacinal.

## Caso 5 — mãe HBsAg positiva

RN a termo, mãe com HBsAg positivo no pré-natal.

**Interpretação:** o bebê precisa de vacina hepatite B e imunoglobulina específica no pós-parto imediato, não apenas uma das duas.

## Caso 6 — prematuro pequeno

RN prematuro pesa 1.750 g e está clinicamente estável. Pergunta-se sobre BCG.

**Interpretação:** adiar BCG até atingir 2 kg. As demais vacinas devem ser avaliadas conforme idade cronológica e particularidades do prematuro.

## Caso 7 — coriza no dia da vacina

Criança de 4 meses está ativa, mamando normalmente, com coriza leve e sem comprometimento sistêmico.

**Interpretação:** quadro leve não é contraindicação automática. Evite perder oportunidade vacinal sem motivo real.

---

# Pegadinhas de residência

### 1. “Esquema atrasado precisa ser reiniciado”

**Falso.** Aproveite doses válidas e complete o que falta.

### 2. “A rotina atual da pólio usa VOP nos reforços”

**Falso.** O calendário atual utiliza VIP aos 2, 4 e 6 meses, com reforços aos 15 meses e 4 anos.

### 3. “VPC20 aos 2 meses e VPC10 aos 4 meses é erro”

**Falso em 2026.** É o esquema oficial durante a transição para VPC20.

### 4. “Rotavírus D1 só pode ser feito até 3 meses e 15 dias”

**Desatualizado.** No PNI 2026, D1 pode ser administrada até 11 meses e 29 dias.

### 5. “Aos 12 meses o reforço meningocócico continua sendo MenC”

**Falso.** O reforço é feito com MenACWY.

### 6. “Influenza só aparece em campanha”

**Falso.** É rotina anual de 6 meses a menores de 6 anos; primovacinação exige duas doses com 30 dias de intervalo.

### 7. “BCG sem cicatriz deve ser repetida”

**Falso.** Ausência de cicatriz não indica revacinação.

### 8. “HPV de rotina exige duas doses para todo adolescente”

**Falso.** A rotina do PNI para 9–14 anos utiliza HPV4 em dose única, conforme histórico.

### 9. “Febre amarela aos 6 meses é rotina”

**Falso.** Entre 6 e 8 meses, apenas em alto risco epidemiológico após avaliação. Rotina aos 9 meses.

### 10. “Calendário SBP/SBIm é igual ao PNI”

**Falso.** As sociedades podem recomendar esquemas mais amplos e vacinas não oferecidas universalmente pelo SUS.

### 11. “Toda doença aguda leve contraindica vacinação”

**Falso.** Doença leve sem comprometimento importante geralmente não exige adiamento.

### 12. “Prematuro usa idade corrigida para calendário vacinal”

**Falso.** Em geral, usa idade cronológica, respeitando exceções específicas.

### 13. “Toda criança de 5 anos deve receber VPC20”

**Falso.** No ponto de 5 anos do calendário 2026, a indicação é para povos indígenas sem histórico de pneumo conjugada.

---

# Tabela de revisão rápida

| Idade/situação | Vacinas principais | Detalhe que mais cai |
|---|---|---|
| Nascimento | BCG + HB | BCG <2 kg adia; mãe HBsAg+ = HB + IG |
| 2 meses | Penta + VIP + Rota + VPC20 | quatro vacinas; início VPC20 |
| 3 meses | MenC D1 | meningocócica |
| 4 meses | Penta + VIP + Rota + VPC10 | VPC10 é transição oficial 2026 |
| 5 meses | MenC D2 | completa básico MenC |
| 6 meses | Penta + VIP + covid; influenza a partir daqui | influenza anual <6 anos |
| 9 meses | Febre amarela | 6–8m só alto risco |
| 12 meses | VPC20 + MenACWY + SCR | trio do primeiro aniversário |
| 15 meses | DTP + VIP + SCR + varicela + Hep A | reforços + virais |
| 4 anos | DTP + VIP + varicela + FA | segundo bloco de reforços |
| 5 anos | VPC20 em indígena sem pneumo conjugada | não universal |
| 9–14 anos | HPV4 | 1 dose |
| 10–14 anos | Dengue | 2 doses, 3 meses, conforme estratégia |
| 11–14 anos | MenACWY | 1 dose |
| Rotavírus D1 | até 11m29d | se perder D1, perde oportunidade |
| Rotavírus D2 | até 23m29d | intervalo recomendado 60d |
| Atraso | completar | não reiniciar esquema |
| Prematuro | idade cronológica | BCG depende de ≥2 kg |

---

# Checklist final

Antes de responder uma questão de vacinação:

- [ ] A banca pediu PNI, SBP, SBIm ou rede privada?
- [ ] Qual é a idade exata da criança/adolescente?
- [ ] Quais doses já estão documentadas?
- [ ] Existe vacina com limite etário?
- [ ] O esquema está atrasado? Lembrei de não reiniciar?
- [ ] Para rotavírus, conferi a janela da D1 e D2?
- [ ] Para pneumocócica, considerei a transição VPC10 → VPC20 de 2026?
- [ ] Para pólio, usei VIP como rotina atual?
- [ ] Aos 12 meses, lembrei VPC20 + MenACWY + SCR?
- [ ] Aos 15 meses, lembrei DTP + VIP + SCR + varicela + hepatite A?
- [ ] Aos 4 anos, lembrei DTP + VIP + varicela + febre amarela?
- [ ] A criança tem condição de CRIE/RIE?
- [ ] É prematura ou tem baixo peso?
- [ ] Existe imunodepressão ou uso de imunossupressor?
- [ ] A suposta contraindicação é verdadeira ou falsa?
- [ ] Se mãe HBsAg+, lembrei vacina + imunoglobulina para o RN?
- [ ] No adolescente, revisei HPV, MenACWY, dengue e esquemas conforme histórico?
- [ ] Evitei misturar recomendações da rede privada com a tabela principal do PNI?
`,
  criadoEm: agora,
  atualizadoEm: agora,
  revisadoEm: agora,
};
