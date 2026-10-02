import { mockFrom, type MockQueryBuilder } from "./query";
import { mockRpc } from "./rpc";
import type { MockTable } from "./store";

// Cliente mock fijo a un usuario, sin cookies ni Next: lo usa la simulación
// automática (scripts/simulate-e2e.ts) para "actuar como" cada socio.
export function createMockClientFor(userId: string | null) {
  return {
    from(table: MockTable): MockQueryBuilder {
      return mockFrom(table);
    },
    async rpc(name: string, args: Record<string, string>) {
      return mockRpc(userId, name, args);
    },
  };
}
