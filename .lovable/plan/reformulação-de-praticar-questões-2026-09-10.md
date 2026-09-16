# Reformulação de “Praticar questões”

## Objetivo
Reorganizar visualmente os filtros seguindo a direção “Modern academic dashboard”, sem alterar cores, paleta, dados ou regras existentes.

## Alterações
- Remover “Continuar questões” desta tela, mantendo a retomada pela tela inicial.
- Converter Especialidades em grade responsiva de cards, ordenada por quantidade, com expansão interna de subtemas e busca existente.
- Converter Bancas em chips com estados neutro, incluído e excluído, ordenados por quantidade e expansão progressiva.
- Converter Anos em grade compacta com ano e contagem.
- Converter os três Formatos em cards com ícones e contagens.
- Fixar a ação inferior com total disponível à esquerda e botão à direita.
- Preservar filtros ativos, busca de enunciado, modal, configurações e toda a lógica atual.

## Detalhes técnicos
- Reutilizar exclusivamente tokens e classes de cor já presentes no projeto.
- Reutilizar os ícones Lucide já disponíveis e ampliar o mapeamento por especialidade.
- Manter layout mobile-first com 2 colunas no celular e 3 em telas maiores.
- Validar compilação, interação dos três estados, expansões e visual em desktop e celular.
