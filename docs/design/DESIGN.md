# Design System — AULA MARCADA

Tom visual: **branco e roxo**. Identidade limpa, confiável e organizada — como uma agenda pessoal bem cuidada, não um app corporativo genérico.

---

## 1. Paleta de cores

| Token          | Hex       | Uso                                                |
| -------------- | --------- | -------------------------------------------------- |
| `--bg`         | `#FFFFFF` | Fundo principal                                    |
| `--bg-subtle`  | `#F7F5FC` | Fundo alternado (cards, seções, inputs)            |
| `--purple-900` | `#4C1D95` | Títulos, texto de destaque, header                 |
| `--purple-600` | `#6D28D9` | Cor primária — botões, links, ícones ativos        |
| `--purple-400` | `#A78BFA` | Estados hover/secundários                          |
| `--purple-100` | `#EDE9FE` | Fundos suaves, badges neutros                      |
| `--text`       | `#1F1B2E` | Texto principal (roxo-quase-preto, não preto puro) |
| `--text-muted` | `#6B6478` | Texto secundário                                   |

### Cores de status (independentes do roxo, para não conflitar com a marca)

| Token              | Hex       | Significado                                                           |
| ------------------ | --------- | --------------------------------------------------------------------- |
| `--status-success` | `#10B981` | Compareceu / Pago                                                     |
| `--status-warning` | `#F59E0B` | Pagamento parcial                                                     |
| `--status-danger`  | `#EF4444` | Não compareceu / Não pago                                             |
| `--status-info`    | `#3B82F6` | Aula reposta / Reposição (azul, para não colidir com o roxo da marca) |
| `--status-neutral` | `#D4D0DC` | Aguardando preenchimento / sem informação ainda                       |

> Regra importante: o roxo é a cor da marca — nunca usar roxo pra indicar status de comparecimento/pagamento, pra não confundir com a identidade visual do app. Reposição usa azul justamente por isso.

---

## 2. Tipografia

| Papel         | Fonte                   | Uso                                                                        |
| ------------- | ----------------------- | -------------------------------------------------------------------------- |
| Display       | **Sora** (600/700)      | Títulos, header "AULA MARCADA", nomes de tela                              |
| Texto         | **Inter** (400/500)     | Corpo, labels, textos de card                                              |
| Dados/números | **IBM Plex Mono** (500) | Valores em R$, horários — alinhamento numérico limpo nas telas financeiras |

Escala sugerida: 12 / 14 / 16 / 20 / 24 / 32px, com peso maior reservado pra valores e títulos de tela.

---

## 3. Elemento de assinatura

**Aba lateral colorida no card** — cada card de aula tem uma faixa vertical fina na lateral esquerda (4px), com a cor do status (verde/vermelho/azul/neutro). É a mesma lógica visual de uma pasta de aluno com etiqueta colorida — reforça a metáfora de organização escolar sem precisar de ícone extra. O resto do card fica limpo: fundo branco ou `--bg-subtle`, texto em `--text`.

---

## 4. Componentes principais

### Card de aula

- Fundo: branco, borda arredondada (12px)
- Faixa lateral: cor de status (ver tabela acima)
- Conteúdo: aluno (Inter 500), horário (Plex Mono), valor/status de pagamento (badge pequeno com cor de status)
- Card cinza (slot vazio): fundo `--bg-subtle`, ícone de "+" em `--purple-400`, sem faixa lateral

### Badge de pagamento

- Pílula pequena, fundo suave da cor de status (ex: `--status-danger` a 12% opacidade) + texto na cor cheia
- Ex: "Não pago" (vermelho), "Pagou R$50, falta R$50" (laranja), "Pago com Pix" (verde)

### Navegação inferior (substituindo o menu hambúrguer)

5 itens fixos, ícone + label, fundo branco com leve sombra superior:

```
┌──────────────────────────────────────────┐
│  🏠        👥        ⊕        💰       ☰  │
│ Início    Alunos    (+)   Financeiro  Mais │
└──────────────────────────────────────────┘
```

- **Início** — agenda dia/semana (a tela inicial já especificada)
- **Alunos** — lista de alunos
- **+** — botão central, elevado, círculo cheio em `--purple-600`, ícone branco — atalho direto pra adicionar aula/reposição (mesmo fluxo do botão + já definido)
- **Financeiro** — dashboard financeiro
- **Mais** — menu com itens secundários (configurações, etc., a definir)

O botão **+** central deve se destacar visualmente dos outros 4 (maior, elevado, cor sólida), já que é a ação mais usada no dia a dia.

---

## 5. Aplicação na Tela Inicial (referência rápida)

```
┌──────────────────────────────────────────┐
│  AULA MARCADA                         │
├──────────────────────────────────────────┤
│  ◀   Segunda, 20 de julho   ▶             │
│                                            │
│  MANHÃ                                    │
│  ┃ João — 08:00-09:00 — Pago com Pix      │
│                                            │
│  TARDE/NOITE                              │
│  ┃ Maria — 19:00-20:00 — Aguardando       │
│                                            │
├──────────────────────────────────────────┤
│  🏠     👥      ⊕      💰      ☰          │
└──────────────────────────────────────────┘
```

A faixa lateral (┃) de cada linha usa a cor de status correspondente.
