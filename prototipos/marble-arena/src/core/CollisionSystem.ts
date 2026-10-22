// Registra os contatos de um tiro. A física avisa cada par que começou a se
// tocar; aqui só guardamos os toques DIRETOS da bolinha de tiro, porque a
// eliminação (GDD §4.4) não conta colisões indiretas.

export class CollisionSystem {
  private shooterId: string | null = null;
  private directHits = new Set<string>();

  /** Começa um tiro novo, esquecendo os contatos do anterior. */
  beginShot(shooterId: string): void {
    this.shooterId = shooterId;
    this.directHits.clear();
  }

  /** Chamado pela física para cada par de bolinhas que começou a se tocar. */
  onContact(a: string, b: string): void {
    if (this.shooterId === null) return;
    if (a === this.shooterId) this.directHits.add(b);
    else if (b === this.shooterId) this.directHits.add(a);
  }

  get directHitIds(): string[] {
    return [...this.directHits];
  }
}
