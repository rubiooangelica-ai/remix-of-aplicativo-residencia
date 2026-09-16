# Padrão dos materiais Premium — ResidênciaPro

Este documento define como transformar anotações de aula, anotações pessoais e diretrizes em materiais publicados no módulo **Material de estudos**.

## Princípio principal

O material não deve ser um resumo curto. Deve funcionar como **apostila completa de estudo para residência**, com explicação didática, organização visual, tabelas, fluxos, pontos de prova e complementação por diretrizes atuais.

As anotações originais do David são a base obrigatória. Nada essencial presente nelas deve ser omitido. O conteúdo pode ser reorganizado, expandido, explicado e atualizado por guidelines, consensos e fontes médicas confiáveis.

Regra de qualidade: o material final precisa ficar **mais completo, mais claro e mais organizado** que a anotação original, nunca menor ou superficial.

## Fontes

Priorizar:

1. anotações próprias do David;
2. diretrizes e consensos oficiais atualizados;
3. Ministério da Saúde e sociedades médicas brasileiras pertinentes;
4. guidelines internacionais quando agregarem informação;
5. livros-texto e revisões confiáveis para complementar o raciocínio.

Materiais de outras plataformas podem servir apenas como referência de **estrutura visual e organização didática**. Não copiar texto, tabelas, fluxos, imagens ou identidade editorial.

## Imagens

Podem ser usadas imagens autorais, esquemas próprios, figuras permitidas e imagens de diretrizes quando o uso for adequado e a fonte estiver registrada. Não usar prints de plataformas pagas, videoaulas, imagens com marca d'água ou material sem fonte clara quando houver risco autoral.

## Taxonomia

- Cada material deve ser vinculado a um `assunto_id` **já existente**.
- **Nunca criar, renomear, mover ou reorganizar a taxonomia para acomodar um resumo.**
- Se houver dúvida de encaixe, manter o material fora de publicação até decisão do administrador.

## Estrutura do material

### Cabeçalho

Todo material deve começar com título claro, subtítulo curto, objetivos/tópicos do capítulo e introdução contextual.

### Corpo didático

Dividir o assunto em títulos e subtítulos reais (`#`, `##`, `###`) para que o leitor consiga gerar o **Sumário interativo automaticamente**. Não escrever o capítulo como um bloco contínuo.

Quando aplicável, organizar em conceito, epidemiologia, fisiopatologia, classificação, quadro clínico, diagnóstico, exames, conduta, seguimento, complicações, diferenciais e situações especiais.

A maior parte deve ser explicativa. Listas e tabelas entram quando melhoram a compreensão.

### Quadros de destaque

Usar ao longo do capítulo, quando pertinente:

> **Conceito-chave**  
> Definição ou ideia central.

> **Atenção**  
> Informação que costuma gerar erro ou muda conduta.

> **Pegadinha de prova**  
> Armadilha pontual dentro de uma seção.

> **Como cai na residência**  
> Forma típica de cobrança.

> **Conduta prática**  
> Passo a passo de manejo.

> **Decore**  
> Informação curta de memorização obrigatória.

Os pequenos blockquotes de pegadinha no meio do texto são diferentes da seção final dedicada **Pegadinhas de residência**.

## Tabelas e fluxos

Usar tabelas para comparações, critérios, doses, marcos, calendários, contraindicações e condutas. O leitor do app renderiza as tabelas com **linhas horizontais e verticais em todas as células**.

Quando a conduta tiver sequência lógica, preferir fluxo em passos.

## Integração com guidelines

A diretriz complementa e atualiza as anotações, não as substitui. Usar a sociedade pertinente ao tema, como SBP, SBIm, Febrasgo, SBC, GINA, GOLD, KDIGO, ADA, ACOG/SMFM, IDSA/ATS, OMS, CDC ou NICE.

## Seções especiais interativas

Os próximos materiais devem usar, **quando aplicável**, as seções dedicadas abaixo. O leitor do ResidênciaPro detecta essas seções, retira-as do fluxo principal e as apresenta em painéis próprios no topo do capítulo.

### Casos rápidos

Usar heading dedicado, preferencialmente:

`# Casos rápidos de interpretação`

Criar pequenos cenários que obriguem o aluno a aplicar o conteúdo. Manter resposta e raciocínio de forma curta e objetiva.

### Pegadinhas de residência

Usar heading dedicado:

`# Pegadinhas de residência`

Reunir as armadilhas mais importantes de prova. Isso não impede pequenos quadros “Pegadinha de prova” distribuídos pelo capítulo.

### Tabela de revisão rápida

Usar heading dedicado:

`# Tabela de revisão rápida`

Concentrar números, critérios, comparações e informações de consulta rápida em tabela sempre que o tema permitir.

### Checklist final

Usar heading dedicado:

`# Checklist final`

Listar os pontos que o aluno deve conferir antes de responder uma questão do tema.

No aplicativo, **Tabela de revisão rápida + Checklist final** aparecem juntos no painel **Revisão rápida**.

## Sumário

Não é necessário escrever uma lista manual de sumário. O leitor gera automaticamente o **Sumário interativo** a partir dos headings do Markdown. Cada item leva por scroll suave à seção correspondente.

Se um arquivo importado ainda contiver uma seção literal `# Sumário`, o leitor deve escondê-la do corpo e usar o sumário automático.

## Regra sobre sínteses finais

**Não adicionar “Síntese de alto rendimento” aos próximos resumos.**

Também não é obrigatório criar uma seção textual separada chamada “Resumo de revisão rápida”. O fechamento prático deve ser feito principalmente por **Tabela de revisão rápida** e **Checklist final**, apresentados juntos no painel Revisão rápida.

## Estilo de escrita

- linguagem direta, didática e voltada para residência;
- explicar o porquê das condutas quando isso ajuda a memorizar;
- títulos e subtítulos frequentes;
- evitar texto telegráfico demais;
- evitar parágrafos enormes;
- usar negrito com moderação;
- não parecer transcrição de aula;
- não publicar capítulo incompleto;
- manter profundidade proporcional às anotações originais.

## Metadados

A tabela `materiais` aceita status, nível, origem, fontes, imagens e pontos de prova. O conteúdo completo deve continuar editável pelo administrador.

## Regra de publicação

Para publicar, o material precisa estar vinculado a assunto já existente, ter conteúdo suficiente, passar por revisão do administrador, seguir a estrutura de apostila, respeitar direitos autorais e não depender de qualquer alteração na árvore taxonômica.
