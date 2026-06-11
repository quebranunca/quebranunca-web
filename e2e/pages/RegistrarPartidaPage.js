import { expect } from '@playwright/test';

export class RegistrarPartidaPage {
  constructor(page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'Registrar partida' });
    this.corpo = page.getByTestId('registrar-partida-corpo');
  }

  dupla(numero) {
    return this.dialog.getByRole('region', { name: `Dupla ${numero}` });
  }

  campoAtleta(numeroDupla, rotulo) {
    return this.dupla(numeroDupla).getByLabel(rotulo);
  }

  campoAtletaContainer(nomeInput) {
    return this.dialog.getByTestId(`campo-${nomeInput}`);
  }

  async abrir() {
    await this.page.goto('/partidas/registrar');
    await expect(this.dialog).toBeVisible();
  }

  async selecionarSugestaoRapida(numeroDupla, rotulo, nome) {
    const campo = this.campoAtleta(numeroDupla, rotulo);
    const nomeInput = await campo.getAttribute('name');
    await campo.focus();
    await this.campoAtletaContainer(nomeInput).getByRole('button', { name: new RegExp(nome, 'i') }).click();
    await expect(this.dupla(numeroDupla).getByText(nome)).toBeVisible();
  }

  async buscarESelecionar(numeroDupla, rotulo, termo, nome) {
    const campo = this.campoAtleta(numeroDupla, rotulo);
    const nomeInput = await campo.getAttribute('name');
    await campo.fill(termo);
    await this.campoAtletaContainer(nomeInput).getByRole('button', { name: new RegExp(nome, 'i') }).click();
    await expect(this.campoAtletaContainer(nomeInput).getByText(nome, { exact: true })).toBeVisible();
  }

  async preencherPartidaValida() {
    await this.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await this.selecionarSugestaoRapida(2, 'Atleta 1', 'Bruna Alves');
    await this.selecionarSugestaoRapida(2, 'Atleta 2', 'Carlos Souza');
    await this.dialog.getByRole('button', { name: /Dupla 1/i }).click();
  }
}
