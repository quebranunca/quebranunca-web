import { expect } from '@playwright/test';

export class RegistrarPartidaPage {
  constructor(page) {
    this.page = page;
    this.pagina = page.locator('.registrar-partida-novo-pagina');
    this.corpo = page.getByTestId('registrar-partida-corpo');
  }

  dupla(numero) {
    return this.pagina.getByRole('region', { name: `Dupla ${numero}` });
  }

  campoAtleta(numeroDupla, rotulo) {
    return this.dupla(numeroDupla).getByLabel(rotulo);
  }

  campoAtletaContainer(nomeInput) {
    return this.pagina.getByTestId(`campo-${nomeInput}`);
  }

  async abrir() {
    await this.page.goto('/partidas/registrar');
    await expect(this.page.getByRole('heading', { name: 'Registrar partida' })).toBeVisible();
    await expect(this.page.getByRole('dialog', { name: 'Registrar partida' })).toHaveCount(0);
    await expect(this.pagina).toBeVisible();
  }

  async continuar() {
    await this.pagina.getByRole('button', { name: 'Continuar' }).click();
  }

  async avancarDoGrupo() {
    await expect(this.pagina.getByRole('heading', { name: 'Onde foi a partida?' })).toBeVisible();
    await this.continuar();
    await expect(this.dupla(1)).toBeVisible();
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
    await this.avancarDoGrupo();
    await this.selecionarSugestaoRapida(1, 'Atleta 2', 'Marina Costa');
    await this.continuar();
    await this.selecionarSugestaoRapida(2, 'Atleta 1', 'Bruna Alves');
    await this.selecionarSugestaoRapida(2, 'Atleta 2', 'Carlos Souza');
    await this.continuar();
    await this.pagina.getByRole('button', { name: /Apenas vencedor/i }).click();
    await this.continuar();
    await this.pagina.getByRole('button', { name: /Dupla 1/i }).click();
    await this.continuar();
  }
}
