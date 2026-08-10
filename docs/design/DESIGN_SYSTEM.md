---
name: Tutor System
colors:
  surface: '#fef7ff'
  surface-dim: '#dfd7e5'
  surface-bright: '#fef7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1ff'
  surface-container: '#f3ebf9'
  surface-container-high: '#ede5f3'
  surface-container-highest: '#e8e0ee'
  on-surface: '#1d1a24'
  on-surface-variant: '#4a4455'
  inverse-surface: '#332f39'
  inverse-on-surface: '#f6eefc'
  outline: '#7b7486'
  outline-variant: '#ccc3d7'
  surface-tint: '#7331df'
  primary: '#5300b7'
  on-primary: '#ffffff'
  primary-container: '#6d28d9'
  on-primary-container: '#dac5ff'
  inverse-primary: '#d3bbff'
  secondary: '#5e5c6e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e0f5'
  on-secondary-container: '#646274'
  tertiary: '#6b3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#8f4200'
  on-tertiary-container: '#ffc19e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5b00c5'
  secondary-fixed: '#e4e0f5'
  secondary-fixed-dim: '#c7c4d8'
  on-secondary-fixed: '#1b1a29'
  on-secondary-fixed-variant: '#464555'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb68b'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#743400'
  background: '#fef7ff'
  on-background: '#1d1a24'
  surface-variant: '#e8e0ee'
  bg-subtle: '#F7F5FC'
  purple-900: '#4C1D95'
  purple-400: '#A78BFA'
  text-main: '#1F1B2E'
  text-muted: '#6B6478'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-danger: '#EF4444'
  status-info: '#3B82F6'
  status-neutral: '#D4D0DC'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-strong:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-main: 1rem
  gutter: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  card-padding: 1.25rem
---

# Design System — App de Aulas de Reforço

Tom visual: **branco e roxo**. Identidade limpa, confiável e organizada — como uma agenda pessoal bem cuidada, não um app corporativo genérico.

Tokens estruturados: [`design-system/tokens.json`](./design-system/tokens.json) · Variáveis CSS: [`design-system/css-variables.css`](./design-system/css-variables.css) · Preview visual: [`design-system/preview.html`](./design-system/preview.html)

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

---

## 2. Tipografia

| Papel         | Fonte                   | Uso                                                                        |
| ------------- | ----------------------- | -------------------------------------------------------------------------- |
| Display       | **Sora** (600/700)      | Títulos, header "AULAS DE REFORÇO", nomes de tela                          |
| Texto         | **Inter** (400/500)     | Corpo, labels, textos de card                                              |
| Dados/números | **IBM Plex Mono** (500) | Valores em R$, horários — alinhamento numérico limpo nas telas financeiras |

---

## 3. Elemento de assinatura

**Aba lateral colorida no card** — cada card de aula tem uma faixa vertical fina na lateral esquerda (4px), com a cor do status (verde/vermelho/azul/neutro).

---

## 4. Componentes principais

### Card de aula

- Fundo: branco, borda arredondada (12px)
- Faixa lateral: cor de status
- Conteúdo: aluno (Inter 500), horário (Plex Mono), valor/status de pagamento

### Navegação inferior

5 itens fixos: Início, Alunos, (+), Financeiro, Mais. O botão central (+) é elevado e roxo.
