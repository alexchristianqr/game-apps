export interface Guess {
  kind: "guess";
  animal: string;
}

export interface Question {
  kind: "question";
  text: string;
  yes: TreeNode;
  no: TreeNode;
}

export type TreeNode = Guess | Question;
export type Answer = "yes" | "no";
export type Path = readonly Answer[];

export interface Scoreboard {
  /** Veces que el juguete adivinó */
  robot: number;
  /** Veces que el juguete falló y aprendió */
  player: number;
}

export const EMPTY_SCORE: Scoreboard = { robot: 0, player: 0 };

const guess = (animal: string): Guess => ({ kind: "guess", animal });
const ask = (text: string, yes: TreeNode, no: TreeNode): Question => ({ kind: "question", text, yes, no });

/** Conocimiento inicial: lo justo para que la primera partida ya funcione. */
export const SEED_TREE: TreeNode = ask(
  "¿Vive en el agua?",
  ask("¿Es un anfibio?", guess("Rana"), guess("Pez")),
  ask(
    "¿Tiene alas?",
    ask("¿Es un insecto?", guess("Mariposa"), guess("Águila")),
    ask("¿Es un reptil?", guess("Serpiente"), ask("¿Es muy grande?", guess("Elefante"), ask("¿Maúlla?", guess("Gato"), guess("Perro"))))
  )
);

/** Guard para datos de localStorage: un árbol corrupto no debe romper el juego. */
export function isNode(value: unknown, depth = 0): value is TreeNode {
  if (depth > 200 || typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v["kind"] === "guess") return typeof v["animal"] === "string" && v["animal"].trim() !== "";
  if (v["kind"] === "question") return typeof v["text"] === "string" && v["text"].trim() !== "" && isNode(v["yes"], depth + 1) && isNode(v["no"], depth + 1);
  return false;
}

export function nodeAt(tree: TreeNode, path: Path): TreeNode {
  let node = tree;
  for (const step of path) {
    if (node.kind !== "question") break;
    node = node[step];
  }
  return node;
}

export function countAnimals(tree: TreeNode): number {
  return tree.kind === "guess" ? 1 : countAnimals(tree.yes) + countAnimals(tree.no);
}

/** Compara sin mayúsculas ni tildes para no duplicar «Águila» / «aguila». */
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}

export function knows(tree: TreeNode, animal: string): boolean {
  if (tree.kind === "guess") return fold(tree.animal) === fold(animal);
  return knows(tree.yes, animal) || knows(tree.no, animal);
}

/** Animal: espacios colapsados y primera letra en mayúscula. */
export function normalizeAnimal(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Pregunta: sin signos duplicados y siempre entre ¿ ? */
export function normalizeQuestion(text: string): string {
  const clean = text.trim().replace(/^¿+/, "").replace(/\?+$/, "").trim().replace(/\s+/g, " ");
  if (clean === "") return "";
  return `¿${clean.charAt(0).toUpperCase()}${clean.slice(1)}?`;
}

export interface Lesson {
  animal: string;
  question: string;
  /** Respuesta correcta a la pregunta para el animal nuevo */
  answerForNew: Answer;
}

/** Devuelve un árbol nuevo donde la hoja de `path` pasa a ser una pregunta que separa el animal viejo del nuevo. */
export function teach(tree: TreeNode, path: Path, lesson: Lesson): TreeNode {
  const fresh = guess(normalizeAnimal(lesson.animal));
  const replace = (node: TreeNode, depth: number): TreeNode => {
    if (depth === path.length || node.kind === "guess") {
      const yes = lesson.answerForNew === "yes" ? fresh : node;
      const no = lesson.answerForNew === "yes" ? node : fresh;
      return ask(normalizeQuestion(lesson.question), yes, no);
    }
    const step = path[depth];
    return { ...node, [step]: replace(node[step], depth + 1) };
  };
  return replace(tree, 0);
}
