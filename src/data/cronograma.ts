export type Bloco = {
  id: string;
  dia: string;
  tema: string;
  area: string;
  minutos: number;
  tipo: "Teoria" | "Questões" | "Revisão" | "Simulado";
};

export const cronograma: Bloco[] = [
  { id: "b1", dia: "Segunda", tema: "Síndromes coronarianas agudas", area: "Clínica Médica", minutos: 60, tipo: "Teoria" },
  { id: "b2", dia: "Segunda", tema: "30 questões de cardiologia", area: "Clínica Médica", minutos: 45, tipo: "Questões" },
  { id: "b3", dia: "Terça", tema: "Abdome agudo e trauma", area: "Cirurgia", minutos: 60, tipo: "Teoria" },
  { id: "b4", dia: "Terça", tema: "Flashcards de ATLS", area: "Cirurgia", minutos: 25, tipo: "Revisão" },
  { id: "b5", dia: "Quarta", tema: "Pré-natal e emergências obstétricas", area: "Obstetrícia e Ginecologia", minutos: 60, tipo: "Teoria" },
  { id: "b6", dia: "Quarta", tema: "25 questões de GO", area: "Obstetrícia e Ginecologia", minutos: 40, tipo: "Questões" },
  { id: "b7", dia: "Quinta", tema: "Puericultura e infecções virais", area: "Pediatria", minutos: 60, tipo: "Teoria" },
  { id: "b8", dia: "Quinta", tema: "Revisão dos erros da semana", area: "Geral", minutos: 30, tipo: "Revisão" },
  { id: "b9", dia: "Sexta", tema: "Epidemiologia e SUS", area: "Medicina Preventiva e Social", minutos: 50, tipo: "Teoria" },
  { id: "b10", dia: "Sexta", tema: "20 questões de preventiva", area: "Medicina Preventiva e Social", minutos: 30, tipo: "Questões" },
  { id: "b11", dia: "Sábado", tema: "Simulado misto 60 questões", area: "Geral", minutos: 120, tipo: "Simulado" },
  { id: "b12", dia: "Domingo", tema: "Revisão ativa dos temas fracos", area: "Geral", minutos: 45, tipo: "Revisão" },
];

export const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
