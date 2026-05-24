import { describe, test, expect } from "vitest";
import {
  METADATA_DELIMITER,
  DEFAULT_METADATA,
  validateMetadata,
  parseTaskNotes,
  serializeTaskNotes,
  isConfigTask
} from "./src/parser.js";

describe("parser.js - Validation de Schéma & Robustesse", () => {
  
  test("validateMetadata - Devrait retourner les valeurs par défaut en cas d'objet nul ou invalide", () => {
    expect(validateMetadata(null)).toEqual(DEFAULT_METADATA);
    expect(validateMetadata(undefined)).toEqual(DEFAULT_METADATA);
    expect(validateMetadata("non-object")).toEqual(DEFAULT_METADATA);
  });

  test("validateMetadata - Devrait valider et corriger columnId", () => {
    // Cas valides
    expect(validateMetadata({ columnId: "todo" }).columnId).toBe("todo");
    expect(validateMetadata({ columnId: "inprogress" }).columnId).toBe("inprogress");
    expect(validateMetadata({ columnId: "done" }).columnId).toBe("done");

    // Cas invalides (fallback à "todo")
    expect(validateMetadata({ columnId: "invalid-status" }).columnId).toBe("todo");
    expect(validateMetadata({ columnId: 123 }).columnId).toBe("todo");
    expect(validateMetadata({ columnId: null }).columnId).toBe("todo");
  });

  test("validateMetadata - Devrait valider et nettoyer les tags", () => {
    // Cas valide
    const input = { tags: ["Urgent", "  Client  ", ""] };
    const output = validateMetadata(input);
    expect(output.tags).toEqual(["Urgent", "Client"]);

    // Cas invalides (fallback à tableau vide)
    expect(validateMetadata({ tags: "not-an-array" }).tags).toEqual([]);
    expect(validateMetadata({ tags: [123, null, {}] }).tags).toEqual([]);
  });

  test("validateMetadata - Devrait valider et nettoyer les subtasks", () => {
    // Cas valide complet
    const input = {
      subtasks: [
        { id: "123", title: "Faire A", completed: true },
        { id: "   ", title: "  Faire B  ", completed: "truthy" },
        { title: "Faire C" } // ID manquant
      ]
    };
    const output = validateMetadata(input);
    expect(output.subtasks[0]).toEqual({ id: "123", title: "Faire A", completed: true });
    expect(output.subtasks[1].title).toBe("Faire B");
    expect(output.subtasks[1].completed).toBe(true);
    expect(output.subtasks[2].id).toBeDefined(); // ID auto-généré
    expect(output.subtasks[2].title).toBe("Faire C");
    expect(output.subtasks[2].completed).toBe(false);

    // Cas invalides (fallback à tableau vide)
    expect(validateMetadata({ subtasks: "not-an-array" }).subtasks).toEqual([]);
    expect(validateMetadata({ subtasks: [null, "not-an-object"] }).subtasks).toEqual([]);
  });

  test("validateMetadata - Devrait valider gmailUrl, gmailId et gmailSubject", () => {
    // Cas valides
    const input = {
      gmailId: "12345",
      gmailSubject: "Devis client",
      gmailUrl: "https://mail.google.com/mail/u/0/#inbox/12345"
    };
    const output = validateMetadata(input);
    expect(output.gmailId).toBe("12345");
    expect(output.gmailSubject).toBe("Devis client");
    expect(output.gmailUrl).toBe("https://mail.google.com/mail/u/0/#inbox/12345");

    // Cas invalides (fallback à null ou types nettoyés)
    const invalidInput = {
      gmailId: 12345, // pas une chaîne
      gmailSubject: "  ",
      gmailUrl: "http://insecure-url.com" // ne commence pas par https://
    };
    const invalidOutput = validateMetadata(invalidInput);
    expect(invalidOutput.gmailId).toBeNull();
    expect(invalidOutput.gmailSubject).toBe("");
    expect(invalidOutput.gmailUrl).toBeNull();
  });

  test("validateMetadata - Devrait valider et conserver le champ archived", () => {
    // Par défaut
    expect(validateMetadata({}).archived).toBe(false);

    // Vrai
    expect(validateMetadata({ archived: true }).archived).toBe(true);

    // Faux
    expect(validateMetadata({ archived: false }).archived).toBe(false);

    // Falsy/Truthy conversions
    expect(validateMetadata({ archived: "truthy" }).archived).toBe(true);
    expect(validateMetadata({ archived: 0 }).archived).toBe(false);
  });

});

describe("parser.js - Désérialisation (parseTaskNotes)", () => {

  test("parseTaskNotes - Devrait renvoyer des valeurs vides/défauts si aucun texte ou type invalide", () => {
    expect(parseTaskNotes(null)).toEqual({ description: "", metadata: DEFAULT_METADATA });
    expect(parseTaskNotes(undefined)).toEqual({ description: "", metadata: DEFAULT_METADATA });
    expect(parseTaskNotes("")).toEqual({ description: "", metadata: DEFAULT_METADATA });
    expect(parseTaskNotes(123)).toEqual({ description: "", metadata: DEFAULT_METADATA });
  });

  test("parseTaskNotes - Devrait extraire correctement un texte sans délimiteur de métadonnées", () => {
    const input = "Rappeler le client demain matin à 10h.";
    const result = parseTaskNotes(input);
    expect(result.description).toBe(input);
    expect(result.metadata).toEqual(DEFAULT_METADATA);
  });

  test("parseTaskNotes - Devrait parser avec succès des métadonnées valides", () => {
    const json = JSON.stringify({
      columnId: "inprogress",
      tags: ["Urgent"],
      gmailUrl: "https://mail.google.com/mail/u/0/#inbox/abc"
    });
    const input = `Rédiger le rapport mensuel.${METADATA_DELIMITER}${json}`;
    const result = parseTaskNotes(input);
    expect(result.description).toBe("Rédiger le rapport mensuel.");
    expect(result.metadata.columnId).toBe("inprogress");
    expect(result.metadata.tags).toEqual(["Urgent"]);
    expect(result.metadata.gmailUrl).toBe("https://mail.google.com/mail/u/0/#inbox/abc");
  });

  test("parseTaskNotes - Devrait être tolérant aux erreurs si le JSON est corrompu ou incomplet", () => {
    const badJson = "{\"columnId\": \"inprogress\", tags: Urgent [corrupted json]";
    const input = `Un texte.${METADATA_DELIMITER}${badJson}`;
    
    // Devrait capturer l'erreur, utiliser DEFAULT_METADATA et restaurer l'intégralité du texte
    const result = parseTaskNotes(input);
    expect(result.description).toBe(input.trim());
    expect(result.metadata).toEqual(DEFAULT_METADATA);
  });

});

describe("parser.js - Sérialisation (serializeTaskNotes)", () => {

  test("serializeTaskNotes - Devrait compiler proprement la description et le JSON validé", () => {
    const description = "   Tâche à faire  ";
    const metadata = {
      columnId: "done",
      tags: ["Projet", "  Client A  "],
      gmailUrl: "https://mail.google.com"
    };

    const output = serializeTaskNotes(description, metadata);
    expect(output.startsWith("Tâche à faire")).toBe(true);
    expect(output.includes(METADATA_DELIMITER)).toBe(true);
    
    // On extrait le JSON et on le reparse pour valider
    const parts = output.split(METADATA_DELIMITER);
    const parsedJson = JSON.parse(parts[1]);
    expect(parsedJson.columnId).toBe("done");
    expect(parsedJson.tags).toEqual(["Projet", "Client A"]);
    expect(parsedJson.gmailUrl).toBe("https://mail.google.com");
  });

});

describe("parser.js - Tâches de Configuration (isConfigTask)", () => {

  test("isConfigTask - Devrait identifier la tâche de configuration système", () => {
    expect(isConfigTask({ title: "__KANBAN_CONFIG__" })).toBe(true);
    expect(isConfigTask({ title: "Tâche normale" })).toBe(false);
    expect(isConfigTask(null)).toBe(false);
    expect(isConfigTask(undefined)).toBe(false);
    expect(isConfigTask({})).toBe(false);
  });

});
