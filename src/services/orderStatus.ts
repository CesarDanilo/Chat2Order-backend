// Máquina de estados do pedido. Uma mudança de regra de negócio acontece só neste mapa.
const TRANSITIONS: Record<string, string[]> = {
  PENDENTE: ["CONCLUIDO", "CANCELADO"],
  CONCLUIDO: ["CANCELADO"],
  CANCELADO: [],
};

const INITIAL_STATUSES = ["PENDENTE", "CONCLUIDO"];

// Status antigo, fora do mapa, pode ir para qualquer valor: é a forma de corrigi-lo.
export function canTransition(from: string, to: string) {
  if (from === to) return true;

  const allowed = TRANSITIONS[from];

  return allowed ? allowed.includes(to) : true;
}

export const canCreateWith = (status: string) => INITIAL_STATUSES.includes(status);
