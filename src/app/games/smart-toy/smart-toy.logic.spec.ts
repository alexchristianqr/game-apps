import { countAnimals, isNode, knows, nodeAt, normalizeAnimal, normalizeQuestion, SEED_TREE, teach, type TreeNode } from "./smart-toy.logic";

describe("smart-toy logic", () => {
  it("walks the tree by path", () => {
    expect(nodeAt(SEED_TREE, ["yes", "yes"])).toEqual({ kind: "guess", animal: "Rana" });
    expect(nodeAt(SEED_TREE, ["yes"]).kind).toBe("question");
  });

  it("seed tree is valid and has 8 animals", () => {
    expect(isNode(SEED_TREE)).toBe(true);
    expect(countAnimals(SEED_TREE)).toBe(8);
  });

  it("teach replaces the wrong leaf without mutating the original", () => {
    const before = JSON.stringify(SEED_TREE);
    const next = teach(SEED_TREE, ["yes", "yes"], { animal: "sapo", question: "tiene verrugas", answerForNew: "yes" });
    expect(JSON.stringify(SEED_TREE)).toBe(before);
    expect(nodeAt(next, ["yes", "yes"])).toMatchObject({ kind: "question", text: "¿Tiene verrugas?" });
    expect(nodeAt(next, ["yes", "yes", "yes"])).toEqual({ kind: "guess", animal: "Sapo" });
    expect(nodeAt(next, ["yes", "yes", "no"])).toEqual({ kind: "guess", animal: "Rana" });
    expect(countAnimals(next)).toBe(9);
  });

  it("teach honours answerForNew = no", () => {
    const next = teach(SEED_TREE, ["yes", "no"], { animal: "Tiburón", question: "¿Es un mamífero?", answerForNew: "no" });
    expect(nodeAt(next, ["yes", "no", "no"])).toEqual({ kind: "guess", animal: "Tiburón" });
    expect(nodeAt(next, ["yes", "no", "yes"])).toEqual({ kind: "guess", animal: "Pez" });
  });

  it("guard rejects garbage", () => {
    for (const bad of [null, 3, "x", {}, { kind: "guess" }, { kind: "guess", animal: " " }, { kind: "question", text: "¿a?", yes: SEED_TREE }]) {
      expect(isNode(bad)).toBe(false);
    }
  });

  it("knows ignores case and accents", () => {
    expect(knows(SEED_TREE, "aguila")).toBe(true);
    expect(knows(SEED_TREE, "  ELEFANTE ")).toBe(true);
    expect(knows(SEED_TREE, "Delfín")).toBe(false);
  });

  it("normalizes animals and questions", () => {
    expect(normalizeAnimal("  oso   pardo ")).toBe("Oso pardo");
    expect(normalizeQuestion("¿¿tiene plumas??")).toBe("¿Tiene plumas?");
    expect(normalizeQuestion("  ")).toBe("");
  });

  it("nodeAt stops at a leaf even with a longer path", () => {
    const leaf: TreeNode = { kind: "guess", animal: "Rana" };
    expect(nodeAt(leaf, ["yes", "no"])).toBe(leaf);
  });
});
