/**
 * Questionário VARK adaptado para Educação Física e Ciências do Esporte
 * 16 perguntas (4 por dimensão, distribuídas aleatoriamente)
 *
 * V = Visual | A = Auditory | R = Reading/Writing | K = Kinesthetic
 */
import { VarkQuestion } from '../types';

export const VARK_QUESTIONS: VarkQuestion[] = [
  {
    id: 'q1',
    text: 'Quando você está aprendendo sobre biomecânica de um movimento (ex: corrida), você prefere:',
    options: [
      { value: 'V', label: 'Ver vídeos em câmera lenta e diagramas das forças envolvidas' },
      { value: 'A', label: 'Ouvir um professor explicando em detalhes como o movimento ocorre' },
      { value: 'R', label: 'Ler um artigo técnico com descrição detalhada da biomecânica' },
      { value: 'K', label: 'Executar o movimento e sentir como seu corpo se comporta' },
    ],
  },
  {
    id: 'q2',
    text: 'Para fixar os nomes dos músculos do membro inferior, você usaria:',
    options: [
      { value: 'V', label: 'Um atlas anatômico com imagens coloridas e legendas' },
      { value: 'A', label: 'Repetir os nomes em voz alta ou ouvir um áudio de anatomia' },
      { value: 'R', label: 'Escrever os nomes várias vezes e criar um glossário próprio' },
      { value: 'K', label: 'Palpar os músculos em si mesmo ou em um colega enquanto aprende' },
    ],
  },
  {
    id: 'q3',
    text: 'Ao estudar fisiologia do exercício (ex: metabolismo energético), você aprende melhor:',
    options: [
      { value: 'V', label: 'Através de gráficos mostrando as vias metabólicas com cores' },
      { value: 'A', label: 'Ouvindo podcasts ou videoaulas com explicações verbais' },
      { value: 'R', label: 'Lendo livros-texto e fazendo resumos estruturados' },
      { value: 'K', label: 'Fazendo um treino e relacionando o cansaço com o que está estudando' },
    ],
  },
  {
    id: 'q4',
    text: 'Quando você não entende um conceito de fisioterapia ou treinamento, você prefere:',
    options: [
      { value: 'V', label: 'Buscar uma imagem, esquema ou mapa mental que ilustre o conceito' },
      { value: 'A', label: 'Conversar com alguém e discutir até entender' },
      { value: 'R', label: 'Pesquisar em livros ou artigos científicos sobre o assunto' },
      { value: 'K', label: 'Encontrar um exemplo prático ou tentando aplicar na prática' },
    ],
  },
  {
    id: 'q5',
    text: 'Para memorizar os princípios do treinamento esportivo, você prefere:',
    options: [
      { value: 'V', label: 'Criar tabelas comparativas e mapas visuais dos princípios' },
      { value: 'A', label: 'Criar histórias ou analogias verbais para cada princípio' },
      { value: 'R', label: 'Escrever listas detalhadas com definições e exemplos' },
      { value: 'K', label: 'Vivenciar os princípios durante uma sessão prática de treino' },
    ],
  },
  {
    id: 'q6',
    text: 'Em uma aula sobre prevenção de lesões esportivas, você presta mais atenção:',
    options: [
      { value: 'V', label: 'Quando o professor usa slides com imagens e vídeos de casos reais' },
      { value: 'A', label: 'Quando o professor explica de forma oral e usa exemplos de atletas' },
      { value: 'R', label: 'Quando o professor distribui materiais escritos com protocolos' },
      { value: 'K', label: 'Quando há demonstrações práticas e você pode simular os movimentos' },
    ],
  },
  {
    id: 'q7',
    text: 'Para estudar a cinesiologia de um gesto esportivo (ex: arremesso), você preferia:',
    options: [
      { value: 'V', label: 'Analisar fotos em sequência mostrando cada fase do movimento' },
      { value: 'A', label: 'Ouvir a descrição passo a passo do movimento por um especialista' },
      { value: 'R', label: 'Ler e anotar as fases do movimento em um caderno técnico' },
      { value: 'K', label: 'Executar o arremesso várias vezes focando nas sensações do corpo' },
    ],
  },
  {
    id: 'q8',
    text: 'Quando você estuda para uma prova de anatomia, você usa principalmente:',
    options: [
      { value: 'V', label: 'Atlas com ilustrações detalhadas e modelos 3D' },
      { value: 'A', label: 'Explicações em voz alta para si mesmo ou para colegas' },
      { value: 'R', label: 'Resumos escritos e fichas com termos técnicos' },
      { value: 'K', label: 'Prática em laboratório de anatomia ou palpação in vivo' },
    ],
  },
  {
    id: 'q9',
    text: 'Ao aprender sobre nutrição esportiva, o formato ideal para você seria:',
    options: [
      { value: 'V', label: 'Infográficos com pirâmide alimentar e tabelas nutricionais coloridas' },
      { value: 'A', label: 'Uma palestra ou podcast com um nutricionista explicando tudo' },
      { value: 'R', label: 'Artigos científicos e protocolos escritos de suplementação' },
      { value: 'K', label: 'Montar um plano alimentar e testar os efeitos nos próprios treinos' },
    ],
  },
  {
    id: 'q10',
    text: 'Para entender como uma articulação funciona (ex: joelho), você prefere:',
    options: [
      { value: 'V', label: 'Ver animações 3D mostrando o movimento e as estruturas envolvidas' },
      { value: 'A', label: 'Ouvir uma explicação oral comparando a articulação a uma dobradiça' },
      { value: 'R', label: 'Estudar uma descrição técnica detalhada de todas as estruturas' },
      { value: 'K', label: 'Mover o próprio joelho e sentir os limites de amplitude' },
    ],
  },
  {
    id: 'q11',
    text: 'Quando você precisa revisar um conteúdo antes de uma prova, você prefere:',
    options: [
      { value: 'V', label: 'Rever mapas mentais e esquemas que você criou anteriormente' },
      { value: 'A', label: 'Discutir o conteúdo com colegas ou se ouvir em áudio' },
      { value: 'R', label: 'Reler seus resumos e anotações com destaque nos pontos-chave' },
      { value: 'K', label: 'Fazer exercícios práticos ou questões simulando situações reais' },
    ],
  },
  {
    id: 'q12',
    text: 'Em uma demonstração prática de técnica esportiva, o que mais te ajuda a aprender:',
    options: [
      { value: 'V', label: 'Observar a execução do professor e analisar o movimento visualmente' },
      { value: 'A', label: 'Ouvir instruções verbais detalhadas enquanto tenta executar' },
      { value: 'R', label: 'Receber um handout com os passos escritos da técnica' },
      { value: 'K', label: 'Executar repetidamente até o corpo "memorizar" o movimento' },
    ],
  },
  {
    id: 'q13',
    text: 'Para compreender os efeitos do treinamento de força no músculo, você prefere:',
    options: [
      { value: 'V', label: 'Ver imagens microscópicas e gráficos de hipertrofia muscular' },
      { value: 'A', label: 'Ouvir um fisiólogo explicar o processo de forma narrativa' },
      { value: 'R', label: 'Ler um texto científico com todos os mecanismos detalhados' },
      { value: 'K', label: 'Fazer um treino e observar como seus músculos respondem' },
    ],
  },
  {
    id: 'q14',
    text: 'Você está aprendendo um protocolo de reabilitação pós-lesão. Você prefere:',
    options: [
      { value: 'V', label: 'Um fluxograma visual mostrando a progressão das fases' },
      { value: 'A', label: 'Um profissional explicando verbalmente cada fase e seus objetivos' },
      { value: 'R', label: 'Um protocolo escrito com critérios claros para progressão' },
      { value: 'K', label: 'Praticar os exercícios de cada fase e sentir a progressão' },
    ],
  },
  {
    id: 'q15',
    text: 'Para aprender sobre avaliação física e testes de performance, você prefere:',
    options: [
      { value: 'V', label: 'Vídeos demonstrando a execução correta de cada teste' },
      { value: 'A', label: 'Um instrutor explicando os critérios e erros comuns verbalmente' },
      { value: 'R', label: 'Manuais técnicos com protocolos e valores de referência' },
      { value: 'K', label: 'Aplicar os testes em si mesmo ou em colegas para praticar' },
    ],
  },
  {
    id: 'q16',
    text: 'Quando você precisa explicar um conceito de Educação Física para alguém, você:',
    options: [
      { value: 'V', label: 'Desenha esquemas ou mostra imagens para ilustrar a explicação' },
      { value: 'A', label: 'Explica verbalmente usando analogias do cotidiano esportivo' },
      { value: 'R', label: 'Escreve ou dita as definições e pontos principais em tópicos' },
      { value: 'K', label: 'Demonstra na prática ou simula o movimento enquanto explica' },
    ],
  },
];

// Labels amigáveis para cada estilo
export const VARK_STYLE_LABELS: Record<string, string> = {
  visual: 'Visual',
  auditory: 'Auditivo',
  reading: 'Leitura/Escrita',
  kinesthetic: 'Cinestésico',
};

// Emojis para cada estilo
export const VARK_STYLE_EMOJIS: Record<string, string> = {
  visual: '👁️',
  auditory: '👂',
  reading: '📖',
  kinesthetic: '🏃',
};

// Cores para cada estilo (classes Tailwind)
export const VARK_STYLE_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  visual: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-600',
  },
  auditory: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    gradient: 'from-purple-500 to-pink-600',
  },
  reading: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600',
  },
  kinesthetic: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    gradient: 'from-orange-500 to-red-600',
  },
};
