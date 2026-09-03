# Fluxo funcional completo da aplicação

Este documento descreve o comportamento funcional da aplicação e deve ser utilizado como referência para o desenvolvimento.

O foco é exclusivamente no fluxo da aplicação, nas regras de negócio e nas interações do usuário. Não devem ser tomadas decisões de arquitetura, banco de dados ou implementação neste momento.

Os modais possuem estruturas visuais semelhantes e poderão posteriormente ser reutilizados, mas essa decisão não faz parte deste escopo.

**Usuário:** um único tipo — o professor que agenda aulas, cadastra alunos, registra presença/pagamento e acompanha o financeiro.

**Dias de operação:** o professor dá aula **de segunda a sexta**. Sábado e domingo não fazem parte da agenda, do cadastro de recorrências nem do agendamento avulso.

---

# 1. Tela de Aulas

A tela inicial da aplicação é a agenda de aulas do AULA MARCADA.

Ela deve permitir visualizar:

- **Dia**
- **Semana**

A visualização semanal deve manter a mesma lógica da visualização diária, apenas agrupando os dias da semana.

Cada dia possui dois períodos:

- **Manhã:** 00h até antes das 12h
- **Tarde/noite:** 12h até antes da meia-noite

A regra funcional é que pode existir **no máximo uma aula por período em cada dia**, portanto um dia pode possuir no máximo:

- 1 aula pela manhã;
- 1 aula à tarde/noite.

Essa restrição é da **agenda do professor** (não por aluno): no mesmo dia e período não podem coexistir duas aulas, mesmo de alunos diferentes.

Quando não existir uma aula em determinado período, deve aparecer uma opção para **adicionar aula**.

O botão de adicionar aula presente nos períodos deve executar a mesma ação do botão **"+" central da navegação**: abrir o modal de agendamento.

## Dias exibidos

A agenda cobre **somente dias úteis (segunda a sexta)**:

- A visão **Semana** exibe de **segunda a sexta** (cinco dias).
- A visão **Dia** exibe apenas um dia útil; **sábado e domingo não aparecem** na agenda.
- **Sábado e domingo** não podem ser selecionados em agendamento avulso nem em aulas recorrentes.

## Navegação temporal

- Visão Dia: setas para dia anterior / seguinte, **sempre entre dias úteis** (ao avançar de sexta, vai para a próxima segunda; ao retroceder de segunda, vai para a sexta anterior).
- Visão Semana: setas para semana anterior / seguinte (sempre semanas de segunda a sexta).
- O dia corrente deve ser destacado na visão semanal (ex.: marca “Hoje”).
- Se hoje for sábado ou domingo, ao abrir a agenda o padrão é exibir a **próxima segunda**.

---

# 2. Cards das aulas

Cada aula exibida na agenda deve possuir informações resumidas suficientes para que o professor consiga identificar rapidamente sua situação.

Informações fixas do card:

- nome do aluno;
- horário (início – fim);
- valor esperado da aula;
- **badge/status** da situação atual.

## Hierarquia do badge

O badge deve comunicar **uma** situação principal, nesta ordem de prioridade:

1. Se presença = **vazia** → **Aguardando preenchimento**
2. Se presença = **Não compareceu** e a falta está totalmente coberta por reposição → **Reposta** (azul; registro de referência imutável)
3. Se presença = **Não compareceu** (ainda com tempo pendente) → **Não compareceu**
4. Se presença = **Compareceu** e situação financeira = **quitada** → **Pago**; quando houver uma única forma de pagamento registrada na aula, exibir também no badge: **Pago · Pix** ou **Pago · Dinheiro**
5. Se presença = **Compareceu** e situação financeira = **parcial** → **Falta R$ X** (onde X é o valor ainda pendente daquela aula)
6. Se presença = **Compareceu** e situação financeira = **pendente** (nada pago) → **Pendente**

Aula criada/vinculada como reposição **comporta-se como aula normal** no badge (itens 1 e 4–6 / Não compareceu). O estado **Reposta** aplica-se às **faltas passadas cobertas**, não à aula atual.

Quando a aula estiver quitada com pagamento misto (mais de uma forma), o badge permanece **Pago**, sem detalhar Pix ou Dinheiro no card.

A forma de pagamento detalhada continua disponível no modal da aula, no perfil do aluno e no financeiro.

## Situação financeira da aula (conceito separado da presença)

Para cada aula com presença **Compareceu**, a aplicação deve saber:

- valor esperado (devido);
- valor já alocado/pago referente a essa aula;
- valor ainda pendente.

Estados financeiros possíveis da aula:

- **Pendente** — nada pago em relação ao valor esperado;
- **Parcial** — pago > 0 e < esperado;
- **Quitada** — pago ≥ esperado (o excesso pago **na própria aula** é receita adicional da aula, não saldo futuro — ver §9).

---

# 3. Adicionar / Agendar Aula

Ao selecionar a opção de adicionar uma aula (slot vazio **ou** botão “+” central), deve ser aberto o modal de agendamento.

O modal deve permitir:

1. Selecionar o dia.
2. Selecionar o horário/período disponível.
3. Selecionar o aluno.
4. Definir a duração da aula.
5. Definir o valor da aula.
6. Marcar a aula como reposição.

## Dia e horário

O seletor de dia deve permitir **apenas datas de segunda a sexta**.

Sábado e domingo não aparecem como opção e não podem ser agendados. Se o professor tentar selecionar um fim de semana no calendário do modal, a data **não** deve ser alterada, deve aparecer a mensagem **“Não é possível agendar aulas no fim de semana.”** e os demais campos do modal devem permanecer bloqueados até que um dia útil seja selecionado.

O professor **pode** agendar uma aula avulsa em um **dia útil já passado** e em um **período já ocorrido no dia de hoje**, desde que o slot esteja vazio. A recorrência **não** gera aulas no passado: o horizonte continua sendo só as semanas futuras (ver §20). Conflito com recorrência vale apenas para ocorrências **ainda não começadas**; no passado, o slot só fica indisponível se já existir aula persistida.

O seletor de data cobre dias úteis de cerca de **6 meses atrás** até o horizonte de **3 meses à frente**.

O modal aberto pelo botão **"+"** deve iniciar sempre com a **data de hoje** (ou o próximo dia útil, se hoje for fim de semana).

O modal aberto pelo botão **Adicionar aula** de um período específico deve iniciar com aquela data e restringir o horário ao período clicado (manhã ou tarde/noite). Ao **alterar a data** no modal, o horário passa a considerar os períodos ainda disponíveis na nova data (manhã, tarde/noite ou ambos, conforme a ocupação).

Se na data selecionada não houver nenhum horário disponível (período que **já possui uma aula**), o campo de horário deve exibir **“Ocupado”** centralizado e o agendamento não pode ser salvo. “Ocupado” **não** se aplica só porque o dia ou o período já passou.

O dia e os horários apresentados devem considerar apenas períodos disponíveis **em dias úteis**.

Não deve ser possível selecionar um período que já possua uma aula.

O horário de início e o horário de término devem permanecer dentro do período escolhido (manhã: 08h–12h; tarde/noite: 12h–22h). O fim deve ser posterior ao início. Em datas passadas e em períodos já ocorridos hoje, a faixa é a **faixa completa** do período — não se restringe ao horário atual.

## Aluno

Após selecionar o aluno, o valor da aula deve ser calculado automaticamente:

- `valor = duração_em_horas × valor_padrão_por_hora_do_aluno`

O valor calculado deve aparecer automaticamente no campo de valor.

O professor pode alterar manualmente o valor **especificamente daquela aula**.

Essa alteração vale somente para aquela aula e **não deve alterar** o valor padrão do aluno nem outras aulas.

## Salvamento

- **Salvar agendamento** cria a aula na agenda com presença **vazia** (badge: Aguardando preenchimento), salvo o fluxo de reposição descrito em §4.
- Cancelar (X) fecha sem criar.

---

# 4. Agendar como reposição

No modal de agendamento existe a opção:

**Marcar como reposição**

Quando ativada:

- a aula passa a ser considerada uma **aula exclusiva de reposição** (não é uma aula “nova” de conteúdo + reposição ao mesmo tempo; o tempo dela existe para quitar tempo de falta);
- visualmente, a aula continua com a mesma estrutura de card;
- deve aparecer uma nova ação no final do modal: **Vincular reposição**.

Essa ação não está presente atualmente no layout de referência e deverá ser adicionada durante o desenvolvimento.

## Comportamento ao salvar com “Marcar como reposição”

1. O professor **deve** vincular ao menos uma falta antes de confirmar o agendamento.  
   Se tentar salvar sem vincular: impedir e informar que é necessário vincular a reposição.
2. Ao tocar em **Vincular reposição**, abre o modal de vinculação (§5) com o aluno já definido.
3. Após confirmar a vinculação, a duração e o valor da aula em agendamento são ajustados conforme §6.
4. Ao voltar ao modal de agendamento, o professor confirma **Salvar agendamento**.

Desligar “Marcar como reposição” remove o vínculo pendente daquele fluxo e esconde o botão **Vincular reposição**.

---

# 5. Modal de Vincular Reposição

O modal de vincular reposição permite relacionar uma aula de reposição a uma ou mais faltas existentes (**Não compareceu** ainda não repostas, ou parcialmente cobertas — ver §6).

O aluno já deve ser conhecido a partir do contexto em que o modal foi aberto (agendamento marcado como reposição **ou** ícone de vincular numa aula existente).

Portanto:

- o nome do aluno deve ser recebido automaticamente;
- o professor **não deve poder alterar o aluno** nesse modal;
- o componente de seleção/troca de aluno presente atualmente no design deve ser removido.

## Seleção das aulas (faltas)

Abaixo das informações principais deve existir uma área para selecionar as faltas relacionadas à reposição.

Regras:

- lista apenas faltas do aluno do contexto com presença **Não compareceu**, **já encerradas** (data/hora de término no passado) e tempo de reposição ainda pendente;
- seleção **múltipla** permitida (uma aula de reposição pode cobrir mais de uma falta);
- cada item mostra: data, horário original, duração pendente de reposição, badge “Não compareceu”.

Essa área deve possuir rolagem própria.

Para evitar que o modal fique excessivamente grande:

- devem aparecer aproximadamente **3 aulas** simultaneamente;
- caso existam mais, o professor deve poder rolar a lista;
- o restante do modal deve continuar preservando a área de seleção/ajuste de horário.

Se não houver faltas pendentes de reposição: exibir estado vazio informativo e não permitir confirmar.

---

# 6. Aulas e reposições: regra de duração

Uma reposição representa **tempo adicional** que precisa ser realizado.

## Dois contextos de cálculo

### A) Aula exclusiva de reposição (criada com “Marcar como reposição”)

A duração necessária da aula é a **soma das durações das faltas selecionadas** (ou das parcelas pendentes dessas faltas).

Exemplo:

- Falta de 1h + falta de 1h → aula de reposição deve ter **2h**.

### B) Aula já existente que recebe vinculação de reposição

A duração total necessária passa a ser:

**duração atual da aula + soma das durações das faltas vinculadas**

Exemplo:

- Aula original: 1h
- Reposição vinculada: 1h
- Necessidade total: **2h**

Não deve existir uma reposição vinculada sem aumentar a quantidade de horas necessárias.

## Ajuste de horário e aviso

O modal deve permitir ajustar início e fim da aula atual.

- Enquanto a duração informada for **menor** que a duração necessária: exibir  
  **Necessário mais X horas de aula.**  
  (X = diferença ainda faltante; pode ser fração, ex.: 0,5h)
- Enquanto houver aviso de tempo insuficiente, **Confirmar reposição** permanece bloqueado.
- Quando a duração cobrir o necessário, o aviso some e a confirmação é liberada.

Se o professor definir duração **maior** que a necessária, o excedente conta como tempo extra daquela aula (e o valor sobe proporcionalmente), sem gerar “crédito” de reposição para o futuro.

## Valor após reposição

Quando uma reposição for confirmada, o **valor esperado** daquela aula deve ser atualizado:

- `novo_valor = nova_duração_em_horas × valor_padrão_por_hora_do_aluno`  
  (ou, se a aula já tinha valor manual específico, recalcular proporcionalmente à variação de duração a partir do valor que estava vigente — prioridade: se nunca houve override manual, usar a fórmula do valor padrão por hora)

Exemplo:

- Aula original: 1h, R$ 50
- Reposição: +1h
- Nova duração: 2h
- Novo valor esperado: R$ 100

Assim, quando o professor marcar a aula como **Compareceu**, o valor de pagamento sugerido já deve aparecer atualizado.

## Cobertura parcial de uma falta

Se uma falta de 2h for parcialmente coberta por uma reposição de 1h:

- a falta permanece **Não compareceu**;
- fica com **1h de reposição ainda pendente**;
- pode ser vinculada novamente em outra aula até zerar o pendente;
- no modal da falta: **Aula reposta?** só muda para **Sim** quando o tempo pendente chegar a zero.

---

# 7. Clicar em uma aula existente

Ao clicar em um card de aula, deve ser aberto o modal de detalhes/preenchimento daquela aula.

Toda aula possui exatamente um dos seguintes estados de presença:

1. **Vazia / aguardando preenchimento**
2. **Compareceu**
3. **Não compareceu**

O professor pode alternar entre esses estados.

Se o estado atual for selecionado novamente, ele deve ser desmarcado e a aula deve retornar ao estado **vazio** — **somente enquanto a data/horário de término da aula ainda não tiver passado**. Após o fim da aula, uma presença já marcada como **Compareceu** ou **Não compareceu** não pode voltar ao vazio.

A situação financeira da aula é uma informação separada da situação de presença.

## Ao voltar para vazio

Ao desmarcar Compareceu ou Não compareceu (retorno ao vazio), quando permitido:

- campos de pagamento, conteúdo, observações e bloco de reposição **somem da interface**;
- dados eventualmente digitados naquela sessão **não são mantidos** se o professor salvar nesse estado vazio (a aula volta a “Aguardando preenchimento”);
- se a aula havia consumido **saldo adiantado**, esse saldo **volta** para o aluno ao salvar o retorno ao vazio (mesma regra da exclusão);
- vínculos de reposição **já confirmados anteriormente** não são desfeitos só por zerar a presença — ver §17 para o que fica bloqueado após preenchimento.

---

# 8. Aula aguardando preenchimento

Quando a aula ainda estiver vazia:

- os campos de preenchimento permanecem ocultos/desmarcados;
- o professor pode selecionar **Compareceu** ou **Não compareceu**.

O card da aula deve indicar:

**Aguardando preenchimento**

---

# 9. Aula marcada como Compareceu

Ao selecionar **Compareceu**, devem aparecer os campos relacionados ao pagamento e à realização da aula.

O card deve passar a indicar a situação conforme a hierarquia do §2 (Pago / Falta R$ X / Pendente).

## Pagamento

O valor do pagamento deve ser preenchido automaticamente com o valor esperado daquela aula.

O professor pode alterar esse valor.

### Valor igual ao esperado

A aula fica registrada como **quitada** quando o valor devido for quitado (pelo pagamento registrado neste modal e/ou por alocações vindas do perfil — §10).

### Valor maior

No modal da aula, o input de pagamento **não permite** valor acima do que ainda falta para quitar a aula (após eventual abatimento de saldo). Valores extras / antecipação entram apenas pelo **Receber pagamento** no perfil do aluno (§25), virando saldo adiantado quando aplicável.

### Valor menor

Se o professor informar um valor menor:

a aplicação deve informar quanto ficou faltando.

Exemplo:

- Aula = R$ 50
- Pagamento = R$ 40

Resultado exibido:

**Falta R$ 10.**

Essa pendência permanece vinculada àquela aula até ser quitada (por novo registro na aula ou por pagamento no perfil do aluno).

### Valor zero / não informar pagamento agora

O professor pode salvar como Compareceu sem quitar. Nesse caso:

- situação financeira = **Pendente**;
- badge do card = **Pendente**.

## Forma de pagamento

No registro feito **pelo modal da aula**, o professor escolhe **uma** forma por registro:

- Pix;
- Dinheiro;
- outras formas que venham a ser adicionadas posteriormente.

Se precisar registrar mais de uma forma para a mesma aula (pagamento misto), deve fazer **registros sucessivos** (ex.: primeiro R$ 30 Pix, depois R$ 20 Dinheiro), ou quitar pelo perfil com pagamentos separados. Cada registro preserva sua forma.

Se a aula já estiver **quitada** com uma única forma e o professor tiver escolhido a forma errada, pode trocar **Pix** por **Dinheiro** (ou o contrário) no mesmo modal, sem desmarcar a presença. Isso só corrige a forma; não apaga nem substitui registros sucessivos já feitos.

A forma de pagamento **não** substitui o estado principal da aula. O badge continua sendo Pago / Falta R$ X / Pendente; quando quitada com uma única forma, pode complementar com **Pago · Pix** ou **Pago · Dinheiro**.

## Consumo de saldo adiantado

O saldo adiantado preserva a forma de origem (**Pix** e/ou **Dinheiro**). Ao consumir, a aplicação abate primeiro o saldo Pix e depois o saldo Dinheiro, atribuindo esses valores à aula para análise financeira.

Se o aluno possuir **saldo adiantado** no momento em que a aula for marcada como **Compareceu**:

1. o sistema aloca automaticamente o saldo nas pendências daquela aula (até o valor esperado);
2. se o saldo cobrir **totalmente** a aula:
   - a aula já nasce **quitada**;
   - **não** aparecem opções de Pix / Dinheiro / Não pago;
   - o input de valor recebido agora fica em **R$ 0,00** (a mãe não pagou nada a mais neste momento);
   - abaixo aparece informação de que a aula foi coberta pelo saldo e o **valor da aula**;
3. se o saldo cobrir **parcialmente**:
   - o input sugere automaticamente o valor **ainda devido** após o abatimento (ex.: aula R$ 150, saldo R$ 100 → input R$ 50) e **não permite** digitar acima desse máximo;
   - abaixo aparece quanto já foi abatido do saldo e o **valor da aula** (valor cheio esperado);
   - o professor escolhe **Pix** ou **Dinheiro** para o valor novo (padrão: **Pix**);
   - **Não pago** não aparece neste caso — o valor novo, se informado, é Pix ou Dinheiro;
   - se o input permanecer zero, a aula fica parcial (saldo aplicado + pendência);
4. o saldo do aluno é reduzido na mesma proporção ao salvar (mantendo a referência Pix/Dinheiro);
5. valores extras / antecipação **não** são registrados neste modal — apenas no perfil do aluno.

---

# 10. Pagamentos parciais e pagamentos que quitam várias aulas

A aplicação deve considerar que o pagamento financeiro não necessariamente corresponde de forma direta a uma única aula.

Podem existir situações como:

- uma aula parcialmente paga em Pix;
- outra aula parcialmente paga em dinheiro;
- um pagamento único quitando várias pendências;
- pagamento antecipado de várias aulas;
- valores adicionais pagos durante uma aula.

Portanto, deve existir uma lógica financeira que permita determinar claramente:

- quanto cada aula deveria receber;
- quanto já foi pago;
- quanto ainda falta;
- quanto foi pago antecipadamente (saldo do aluno);
- quais valores foram recebidos em Pix;
- quais valores foram recebidos em dinheiro.

A interface não deve obrigar o professor a identificar artificialmente um único meio de pagamento para uma situação que envolva mais de uma transação.

## Regra para pagamento pelo perfil do aluno

Se o professor realizar um pagamento pela tela do aluno:

1. Se existirem pendências de aulas (Compareceu com valor em aberto), o valor quita as pendências **das mais antigas para as mais recentes**.
2. Caso um único pagamento cubra várias pendências, a aplicação distribui o valor entre elas **sem perder o histórico da forma de pagamento** (o mesmo pagamento/forma é associado às alocações).
3. Se sobrar valor após quitar todas as pendências, o restante vira **saldo adiantado** do aluno, na **mesma forma** do recebimento (Pix ou Dinheiro).
4. Se não houver pendências, o valor inteiro vira **saldo adiantado** na forma escolhida.

Exemplo:

- Aula A: R$ 50 pendente
- Aula B: R$ 50 pendente
- Professor registra pagamento de R$ 100 em Pix

Resultado:

- Aula A: quitada;
- Aula B: quitada;
- R$ 100 registrados como Pix.

---

# 11. Conteúdo e observações da aula

Quando a aula estiver marcada como **Compareceu**, devem aparecer:

### Conteúdo da aula

Campo para registrar o conteúdo trabalhado.

Limite: **500 caracteres**.

### Observações

Campo separado para observações.

Limite: **500 caracteres**.

Esses campos devem desaparecer quando a aula retornar ao estado vazio ou for marcada como **Não compareceu**.

Não são obrigatórios para salvar.

---

# 12. Aula marcada como Não compareceu

Ao selecionar **Não compareceu**, deve aparecer somente a informação relacionada à reposição.

Inicialmente:

**Aula reposta? Não**

O professor **não** poderá alterar essa informação diretamente nesse modal.

A reposição é vinculada posteriormente pelo fluxo de vinculação (§5 / §15).

Quando o tempo de reposição pendente da falta chegar a zero:

- no modal da falta: **Aula reposta? Sim**;
- no card da falta: badge **Reposta** (azul);
- a falta passa a ser um **registro de referência imutável**: não pode ter presença alterada, horário alterado, nova vinculação nem exclusão;
- contagem de presença, pagamento e valor da aula passam a ser tratados na **aula atual** (a de reposição / destino da vinculação).

O card deve continuar registrando presença **Não compareceu** no histórico (apenas como referência de falta reposta).

Campos de pagamento, conteúdo e observações **não** aparecem nesse estado.

**Impacto financeiro:** enquanto a falta **não** estiver totalmente reposta, ela entra em “Impacto de faltas” pelo valor esperado que a aula teria. Quando o tempo pendente chega a zero (**Reposta**), a falta **sai** do impacto — como se tivesse sido recuperada. A quitação financeira dessa aula original não é exigida (não há cobrança de presença). O tempo continua pendente de reposição até ser coberto.

---

# 13. Ações disponíveis no modal da aula

No topo do modal existem três ações principais:

1. **Excluir aula**
2. **Vincular reposição**
3. **Alterar horário**

---

# 14. Excluir aula

A exclusão exige confirmação explícita. A mensagem depende do estado:

Se a aula ainda não foi preenchida (presença vazia):

> Tem certeza que deseja excluir essa aula?

Se a aula já foi realizada ou possui preenchimento (Compareceu ou Não compareceu):

> Essa aula já foi realizada. Tem certeza que deseja excluir?

## Efeitos ao excluir

- Aula some da agenda.
- Pendências financeiras **somente daquela aula** deixam de existir.
- Se a aula havia **consumido saldo adiantado** do aluno, esse saldo **volta** para o aluno na mesma forma (Pix/Dinheiro) em que havia sido abatido.
- Valores recebidos **na própria aula** (Pix/Dinheiro informados no Compareceu, além do saldo) **não** voltam como saldo do aluno ao excluir; permanecem apenas como receita daquela aula encerrada.
- Se a aula excluída era reposição que cobria faltas, o tempo de reposição daquelas faltas **volta a ficar pendente** (badge **Não compareceu** de novo; voltam a entrar na frequência) e a falta deixa de estar no estado imutável **Reposta**.
- A existência do estado **Reposta** depende da aula vinculadora: sem ela, as faltas cobertas voltam ao fluxo normal.
- Faltas já totalmente repostas (**Reposta**) **não podem ser excluídas**.
- Se a aula excluída era uma falta (Não compareceu) que já tinha reposição vinculada em outra aula, a exclusão da falta **não desfaz** automaticamente a aula de reposição futura — a aula futura permanece, mas o vínculo com a falta removida é desfeito.  
  _(Se isso deixar a aula futura só com tempo “extra” sem falta, o tempo permanece como duração normal da aula.)_

---

# 15. Vincular reposição a uma aula existente

O ícone de vincular reposição abre o mesmo modal de vinculação (§5).

Diferenças em relação ao fluxo do agendamento:

- a aula de destino **já existe**;
- o aluno já está definido e **não pode ser alterado**;
- o seletor de horário deve iniciar com o **horário já definido da aula** (respeitando o período dela);
- a duração atual da aula entra na conta (duração atual + faltas);
- após confirmar, duração e valor esperado da aula existente são atualizados na hora;
- o tempo usado para quitar faltas é apenas o **tempo adicional** (nova duração − duração original).

Demais regras (lista com rolagem, ~3 itens visíveis, aviso de horas faltantes, bloqueio de confirmar com tempo insuficiente) são as mesmas do §5 e §6.

---

# 16. Alterar horário da aula

O terceiro ícone permite alterar exclusivamente o horário/duração da aula.

Essa ação:

- não transforma a aula em outra aula;
- mantém a mesma aula;
- mantém o mesmo aluno;
- apenas altera o horário/duração;
- deve respeitar os períodos disponíveis (não pode mover para um período que já tenha outra aula);
- quando há mais de um período livre na data, o horário pode ser movido entre esses períodos; o card acompanha o período do horário de início;
- início e fim devem permanecer no **mesmo** período (não pode começar de manhã e terminar à tarde/noite);
- ao mudar a data, se o horário atual não couber nos períodos livres, o formulário ajusta para um horário válido;
- pode aumentar ou reduzir a duração, desde que fim > início.

Quando a duração for alterada, o valor esperado da aula deve ser recalculado automaticamente (mesma lógica de §3 / §6).

Se a aula já tiver reposição vinculada, reduzir a duração **abaixo** do necessário para cobrir as faltas vinculadas deve ser impedido, com o mesmo tipo de aviso de horas insuficientes.

---

# 17. Bloqueio das ações

As ações de:

- alterar horário;
- vincular reposição;

devem ficar **bloqueadas** quando a aula já tiver sido preenchida (Compareceu **ou** Não compareceu).

Enquanto a aula ainda não tiver terminado, o professor pode desmarcar a presença (voltar ao vazio) para corrigir cliques acidentais e então alterar horário ou vincular reposição.

Somente uma aula ainda **vazia** pode ter horário alterado ou receber nova vinculação de reposição por esses fluxos.

A exclusão segue §14 e **não** fica bloqueada pelo preenchimento (apenas exige confirmação mais forte).

---

# 18. Tela de Alunos

A tela de alunos possui:

- busca por nome;
- botão **Novo aluno**;
- lista de alunos **ativos**;
- acesso a **Ex-alunos** (alunos desativados).

O botão **Novo aluno** é diferente do botão de adicionar aula.

O botão de adicionar aula é o botão “+” central da navegação (e os slots da agenda).

A lista principal e o seletor de aluno no agendamento mostram **somente alunos ativos**.

---

# 19. Cadastrar aluno

Ao clicar em **Novo aluno**, deve ser aberto o modal de cadastro.

### Dados pessoais

- Nome do aluno _(obrigatório)_
- Nome do responsável _(obrigatório)_
- Telefone do responsável _(obrigatório)_

### Configurações

- **Valor padrão por hora** do aluno _(obrigatório; base do cálculo automático)_;
- Aulas recorrentes _(opcional no cadastro; pode cadastrar sem recorrência e só agendar avulsas)_.

As configurações definidas aqui serão utilizadas para calcular automaticamente os valores das aulas futuras e para gerar as aulas recorrentes na agenda.

---

# 20. Aulas recorrentes do aluno

Para cada recorrência, o professor seleciona:

- dia da semana (**segunda a sexta**);
- período (manhã ou tarde/noite);
- horário de início;
- duração (que define o horário de fim).

## Conflitos

### Conflito do próprio aluno

Se o aluno já possui recorrência no mesmo dia e mesmo período:

> O aluno [nome] já tem aula nesse período.

### Conflito da agenda do professor

Se já existir **qualquer** aula (de qualquer aluno) naquele dia da semana e período na grade recorrente, ou se a geração criar choque com aula já existente na agenda:

> Já existe uma aula nesse período.

## Geração na agenda

- As recorrências geram aulas automaticamente na agenda para as semanas futuras.
- Horizonte de geração: **3 meses à frente** a partir da data corrente (incluindo o dia atual), considerando apenas **segunda a sexta**. Conforme o tempo passa, novas aulas vão sendo geradas para manter esse horizonte.
- Aulas geradas por recorrência nascem com presença **vazia**.
- Alterar valor por hora **recalcula** o valor esperado das aulas **vazias** a partir de hoje (corte); aulas passadas e aulas já preenchidas **não** mudam.
- Alterar recorrência **não altera** aulas passadas nem aulas futuras que já tenham sido preenchidas.
- Aulas **vazias** a partir de hoje que pertenciam à recorrência antiga e **não** batem com a nova regra são **removidas**; o horizonte é regenerado conforme a nova recorrência.
- Aulas avulsas vazias futuras (que nunca bateram com a recorrência) **permanecem**.
- Remover uma recorrência **não apaga** aulas passadas nem preenchidas; remove apenas as **vazias futuras** ligadas àquela recorrência e para de gerar novas.

---

# 21. Card do aluno

Cada aluno na lista deve apresentar:

- nome;
- próxima aula (data relativa + dia da semana quando fizer sentido + horário);
- situação financeira.

### Data relativa da próxima aula

Quando possível:

- Hoje
- Amanhã
- Depois de amanhã
- Nome do dia da semana (ex.: Terça) quando estiver na mesma semana
- Data completa quando estiver mais distante

Se não houver próxima aula agendada: exibir **Sem aulas agendadas**.

### Situação financeira no card

Uma das situações:

- **Em dia** — sem pendências e sem saldo adiantado
- **Pendente** — existe valor em aberto em aulas comparecidas  
  (exibir equivalente em **horas** + valor em R$ quando fizer sentido)
- **Saldo — X horas adiantadas** — existe saldo adiantado  
  (X = saldo em reais ÷ valor padrão por hora; arredondar para baixo na exibição, e mostrar também o valor em R$)

Se houver **pendência e saldo ao mesmo tempo** (caso raro/intermediário), priorizar **Pendente** no card até as pendências serem zeradas.

Cada situação deve ter diferenciação visual correspondente.

---

# 22. Perfil do aluno

Ao clicar no card do aluno, o usuário entra na tela **Perfil do aluno**.

Essa é a única tela que substitui o cabeçalho padrão de **AULA MARCADA**.

No lugar dele:

- seta para voltar (retorna à lista de alunos);
- título **Perfil do aluno**.

---

# 23. Informações do aluno

No topo do perfil:

- nome do aluno;
- informações pessoais em subtítulo (responsável e telefone);
- ação de editar.

O botão de editar abre o modal no padrão de cadastro/edição, porém **somente** com:

- nome do aluno;
- responsável;
- telefone do responsável.

Como há menos campos, o modal deve ser mais compacto.

---

# 24. Card Financeiro do aluno

O perfil possui um card **Financeiro** com a situação atual:

### Saldo adiantado

**Adiantado: 2 horas (R$ 100,00)**  
(exibir equivalente em horas + valor em R$; horas = saldo ÷ valor padrão por hora)

### Saldo pendente

**Pendente: 1 hora (R$ 50,00)**  
(ou apenas R$ quando a conversão em horas inteiras for zero; soma do que falta nas aulas comparecidas em aberto)

### Em dia

**Em dia**

---

# 25. Receber pagamento

Dentro do card financeiro existe a ação de receber pagamento.

Modal **centralizado** (diferente dos bottom sheets).

Deve permitir:

- selecionar forma de pagamento (Pix ou Dinheiro);
- informar o valor;
- confirmar.

Sugestão de valor inicial:

- se houver pendência → total pendente;
- se estiver em dia ou só com saldo → campo livre (pagamento antecipado).

## Utilização do pagamento

Conforme §10:

- com pendências → quita das mais antigas para as mais recentes;
- sobra → saldo adiantado;
- sem pendências → saldo adiantado (antecipação).

Pagamento antecipado (saldo) é **diferente** de valor adicional pago em uma aula já realizada (§9).

A forma de pagamento deve ser preservada para análise financeira (inclusive no saldo adiantado: Pix e Dinheiro ficam separados até serem consumidos nas aulas).

Um pagamento misto Pix+Dinheiro no mesmo momento exige **dois recebimentos** sucessivos neste fluxo (um por forma).

---

# 26. Configurações do aluno

Abaixo do financeiro, um card com:

- valor por hora;
- aulas recorrentes.

Regra de interação:

- **remover** os ícones individuais de edição;
- **remover** o botão separado de adicionar aula recorrente;
- manter **apenas um botão editar** no canto superior direito do card.

Esse botão abre um único fluxo para editar:

- valor padrão por hora;
- aulas recorrentes (incluir, alterar e remover linhas).

Alterações de valor padrão **não** alteram aulas passadas nem o valor já gravado em aulas futuras já criadas; passam a valer para **novas** gerações/cálculos a partir de então (aulas ainda não criadas ou novos agendamentos sem override).

---

# 27. Frequência

Filtros:

- Esta semana;
- Este mês;
- Este ano;
- Geral.

Apresentação:

**Presente em X de Y aulas**

- X = aulas com presença **Compareceu** no período
- Y = aulas do aluno no período que já não estão vazias **ou** todas as aulas do período com data ≤ hoje (incluindo Não compareceu).

Regra adotada: Y = aulas do aluno no período com data/hora de início já ocorrida (passadas), independentemente de estarem preenchidas; aulas futuras não entram. Aulas passadas ainda vazias contam em Y mas não em X (baixam a frequência até serem preenchidas).

Faltas totalmente repostas (**Reposta**) **não entram** em X nem em Y: ficam apenas como referência.

A **aula atual que vincula** essas faltas (tem reposição vinculada) **entra na base** assim que é criada, no período da sua data — inclusive enquanto estiver “Aguardando preenchimento”. Ao marcar **Compareceu**, entra em X como qualquer aula normal.

Representação visual proporcional: X / Y.

---

# 28. Desativar aluno (Ex-alunos)

No perfil de um aluno **ativo**, a ação de desativação **não apaga** o aluno nem o histórico.

Em vez disso, o aluno é **desativado** e passa a constar em **Ex-alunos**.

## Confirmação da desativação

Exige digitar exatamente o nome do aluno antes de confirmar.

## Efeitos da desativação

- o aluno deixa de aparecer na lista padrão de alunos;
- o aluno **não** pode ser selecionado ao criar/agendar aula;
- as **aulas futuras** desse aluno são removidas da agenda (slots liberados);
- as **aulas já ocorridas** (e respectivos pagamentos/registros) **permanecem** para consulta, financeiro e estatísticas;
- as **recorrências** do aluno são removidas e deixam de ocupar a grade para novos agendamentos;
- o perfil continua acessível a partir de **Ex-alunos**, como base de consulta.

Alunos desativados ficam fora do fluxo operacional padrão, mas permanecem como base histórica.

## Reativar aluno

No perfil de um **Ex-aluno**, o professor pode **Ativar aluno**.

### Efeitos da reativação

- o aluno volta a aparecer na lista padrão de alunos e pode ser selecionado ao agendar aula;
- **histórico de aulas**, **financeiro** (pendências, adiantamentos) e **valor por hora** permanecem como estavam;
- **não** há aulas recorrentes nem geração automática na agenda (as recorrências já haviam sido removidas na desativação);
- o professor pode cadastrar novas recorrências ou agendar aulas avulsas depois da reativação.

A reativação **não** restaura configurações de recorrência anteriores.

## Excluir aluno (Ex-alunos)

No perfil de um **Ex-aluno**, abaixo de **Ativar aluno**, o professor pode **Excluir aluno**.

Só é possível excluir alunos **desativados**. Alunos ativos devem ser desativados antes.

### Confirmação da exclusão

Exige digitar exatamente o nome do aluno antes de confirmar.

### Efeitos da exclusão

- o aluno e **todos os seus dados** são removidos permanentemente: aulas, pagamentos, recorrências, histórico e saldos de adiantamento;
- a ação **não** pode ser desfeita;
- se o ex-aluno tinha aulas de reposição vinculadas a faltas de **outros** alunos, os vínculos são desfeitos e o tempo pendente de reposição nas faltas dos outros alunos é restaurado;
- após a exclusão, o professor é redirecionado para a lista de alunos.

---

# 29. Histórico de aulas

A definição visual detalhada do histórico completo no perfil será feita posteriormente. Funcionalmente, o histórico das aulas ocorridas permanece vinculado ao aluno (incluindo ex-alunos) para consulta e estatísticas.

---

# 30. Tela Financeiro

Filtros de granularidade:

- Semana;
- Mês;
- Ano.

Seletor de período correspondente:

- uma semana;
- um mês;
- um ano.

Filtro de aluno:

- todos os alunos;
- um aluno específico.

Todos os indicadores, o gráfico e a lista de pendências respeitam esses filtros.

---

# 31. Indicadores financeiros

### Esperado

Soma dos **valores esperados** das aulas **agendadas no período** cuja presença **não** é “Não compareceu”.  
Inclui aulas vazias e aulas comparecidas (o que “deveria entrar” pelo calendário ativo).  
Faltas (Não compareceu) **não** entram no Esperado. Faltas **ainda não totalmente repostas** entram no Impacto de faltas.

### Realizado

Soma dos valores **efetivamente recebidos** no período (alocações a aulas + valores adicionais de aula + …), conforme filtros.

Além do total, deve ser possível ver a composição por forma de pagamento:

**Realizado: R$ 2.000**

- Pix: R$ 1.200 — 60%
- Dinheiro: R$ 800 — 40%

Essa decomposição **não** substitui os indicadores principais; é detalhe do Realizado.

### Impacto de faltas

Soma dos valores esperados das aulas com presença **Não compareceu** no período que **ainda têm tempo de reposição pendente** (o que deixou de ser recebido por falta não recuperada).

Faltas já totalmente **Repostas** **não** entram no impacto. A receita da reposição entra no Realizado/Esperado da **aula de reposição**, na data dela. Se a reposição também for marcada como falta, essa aula de reposição passa a contar no impacto até ser coberta.

---

# 32. Regra para estatísticas de forma de pagamento

A forma de pagamento é contabilizada pelos **valores efetivamente recebidos** em cada forma.

Pagamentos mistos/parciais somam em cada forma o valor correspondente.

Não classificar a aula inteira como “Pix” ou “Dinheiro” quando houver mais de uma forma.

---

# 33. Gráfico financeiro

Comparativo de barras verticais:

- **Esperado**
- **Realizado**

### Semana

Eixo: segunda a sexta.

### Mês

Eixo: semanas do mês (4 ou 5).

### Ano

Eixo: janeiro a dezembro.

---

# 34. Pagamentos pendentes

Lista ao final da tela financeira.

- Ordenação: **mais recentes → mais antigos** (exibição).
- A quitação automática pelo perfil continua sendo **mais antigas → mais recentes** (§10).

Cada item:

- nome do aluno;
- data da aula;
- valor ainda pendente.

Tocar no item: abre o **Perfil do aluno** correspondente (atalho). O recebimento continua sendo feito pelo modal do perfil.

Somente aulas **Compareceu** com valor em aberto entram nesta lista.

---

# 35. Navegação inferior

Itens:

| Item        | Função                            |
| ----------- | --------------------------------- |
| Início      | Agenda (Dia/Semana)               |
| Alunos      | Lista de alunos                   |
| “+” central | Mesma ação de adicionar aula (§3) |
| Financeiro  | Tela financeira                   |
| Mais        | Fora deste fluxo (§35)            |

---

# 36. Regras globais importantes

1. Uma aula possui três estados de presença: vazia; compareceu; não compareceu.
2. Clicar novamente no estado selecionado desmarca e volta a vazia.
3. Presença e situação financeira são conceitos separados.
4. Cards usam badges claros conforme a hierarquia do §2.
5. Forma de pagamento não é estado principal da aula.
6. Uma aula pode ter pagamento parcial.
7. Um pagamento (no sentido financeiro) pode envolver mais de uma forma ao longo do tempo; cada registro preserva uma forma.
8. Um único pagamento no perfil pode quitar várias aulas.
9. No perfil, a distribuição respeita pendências das mais antigas para as mais recentes.
10. O sistema mantém: pago por aula, pendente por aula, saldo adiantado do aluno, receita adicional de aula.
11. Pix e dinheiro permanecem identificáveis na análise financeira.
12. Pagamento acima do valor da aula realizada = receita adicional da aula; **não** gera saldo.
13. Pagamento sem pendências (ou sobra após quitá-las) = saldo antecipado para aulas futuras.
14. Aulas já preenchidas não podem ter horário alterado pelo fluxo de alteração de horário.
15. Aulas já preenchidas não podem receber novas reposições pelo fluxo de vinculação.
16. Valor automático = duração × valor padrão por hora do aluno (salvo override daquela aula).
17. Alterações futuras no valor padrão não alteram aulas passadas.
18. Aulas avulsas não alteram configurações recorrentes.
19. Alterações específicas de uma aula não alteram o cadastro do aluno.
20. Reposição aumenta horas necessárias e o valor esperado da aula de destino.
21. Com reposição pendente de tempo, informar claramente quantas horas ainda faltam.
22. Aluno da reposição vem do contexto e não pode ser alterado no modal de vinculação.
23. Listas de faltas no modal de vinculação têm rolagem própria (~3 itens visíveis).
24. Alterações financeiras e de configuração preservam o histórico das aulas anteriores.
25. No máximo uma aula por período por dia na agenda do professor.
26. Saldo adiantado é consumido automaticamente ao marcar Compareceu.
27. “Aula reposta? Sim” só quando o tempo pendente da falta chega a zero.
28. A agenda, recorrências e agendamentos avulsos limitam-se a **segunda a sexta**; sábado e domingo ficam fora do fluxo.

---

# 37. Funcionalidades futuras

Não fazem parte deste fluxo neste momento:

- modo escuro;
- configurações gerais / conteúdo do botão **Mais**;
- funcionalidades adicionais do botão “+” além de agendar aula;
- edição visual detalhada do histórico de aulas;
- converter pagamento recebido na própria aula em saldo do aluno ao excluir (o que volta é só o **saldo adiantado** que havia sido consumido);
- agendamento em sábado ou domingo;
- múltiplas formas de pagamento em um único formulário simultâneo.

Essas funcionalidades serão definidas posteriormente.

---

# 38. Decisões preenchidas nesta revisão (antes incompletas)

| Tema                                 | Decisão adotada                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| Badge do card                        | Hierarquia explícita (§2); Pago · Pix/Dinheiro quando quitada com forma única    |
| “+” central                          | Igual a adicionar aula                                                           |
| Valor padrão                         | Por **hora**, base do cálculo automático                                         |
| Marcar como reposição no agendamento | Exige vincular antes de salvar; aula exclusiva de reposição                      |
| Seleção de faltas                    | Múltipla; soma de durações                                                       |
| Confirmar com tempo insuficiente     | Bloqueado                                                                        |
| Cobertura parcial de falta           | Permitida; “Aula reposta? Sim” só com pendência zero                             |
| Pagamento misto na aula              | Registros sucessivos (uma forma por vez)                                         |
| Excessso na aula vs saldo            | Excessso na aula = receita; antecipação só sem pendência (ou sobra no perfil)    |
| Consumo de saldo                     | Ao marcar Compareceu                                                             |
| Geração de recorrência               | Horizonte de 3 meses (seg–sex)                                                   |
| Dias de operação                     | Segunda a sexta em agenda, recorrência e agendamento; fim de semana excluído     |
| Semana na UI                         | Segunda a sexta (visão Semana e Dia)                                             |
| Esperado vs Impacto                  | Faltas saem do Esperado; só faltas ainda não repostas entram no Impacto          |
| Pendentes no financeiro              | Só Compareceu com valor em aberto; toque → perfil                                |
| Limite de texto                      | 500 caracteres em conteúdo e observações                                         |
| Frequência                           | Y = aulas já ocorridas do período, excluindo faltas Reposta                      |
| Editar configurações no perfil       | Um único botão no card                                                           |
| Exclusão e reposição                 | Desfaz cobertura de tempo se a aula de reposição for excluída                    |
| Desativar aluno                      | Soft-delete; aulas futuras saem da agenda; histórico permanece; lista Ex-alunos  |
| Reativar aluno                       | Volta à lista ativa; mantém histórico, financeiro e valor/hora; sem recorrências |
| Excluir aluno (Ex-alunos)            | Hard-delete permanente; só ex-alunos; remove todos os dados do aluno             |
