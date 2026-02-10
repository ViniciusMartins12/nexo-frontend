/**
 * Checklist de documentos por membro familiar.
 * onlyCandidato: item aparece apenas na coluna do Candidato.
 */
export type ChecklistItem = {
  id: string;
  label: string;
  onlyCandidato?: boolean;
};

export type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
};

export const DOCUMENT_CHECKLIST: ChecklistSection[] = [
  {
    title: "Comprovação e/ou alteração de grupo familiar",
    items: [
      { id: "1", label: "Documentos de Identificação" },
      { id: "1.1", label: "Certidão de Nascimento do candidato e demais membros solteiros do grupo familiar" },
      { id: "1.2", label: "RG e CPF de todos os membros do grupo familiar" },
      { id: "2", label: "Candidato e demais membros do grupo familiar casados" },
      { id: "2.1", label: "Certidão de Casamento ou Declaração de União Estável (instrumento particular - MODELO 9)" },
      { id: "3", label: "SE houver divórcio" },
      { id: "3.1", label: "Certidão de Casamento civil com Averbação" },
      { id: "3.2", label: "Termo de Audiência e/ou Formal de Partilha designando guarda e pensão" },
      { id: "4", label: "SE houver óbitos - Atestado de óbito e inventário" },
      { id: "5", label: "SE candidato com deficiência - Laudo médico atestando espécie e grau (Art. 4º Dec. 3.298/1999, com CID)", onlyCandidato: true },
      { id: "6", label: "Histórico Escolar do Candidato" },
      { id: "6.1", label: "Ensino Médio", onlyCandidato: true },
      { id: "6.2", label: "Caso o histórico não esteja pronto: declaração da Instituição com todos os anos cursados no ensino médio", onlyCandidato: true },
      { id: "6.3", label: "SE bolsista integral em escola particular: declaração de bolsa integral durante todo o ensino médio", onlyCandidato: true },
      { id: "7", label: "Comprovante de residência atual (até 3 meses) de todos os membros do grupo familiar - maiores de 18 anos" },
      { id: "8", label: "SE houver irmãos solteiros que não residam com o grupo familiar - Comprovante de residência atual" },
      { id: "9", label: "SE houver irmãos casados/união estável" },
      { id: "9.1", label: "Certidão de Casamento ou Declaração de União Estável (MODELO 9)" },
      { id: "9.2", label: "Comprovante atual (até 3 meses) de residência" },
      { id: "10", label: "Comprovantes de despesas declaradas na ficha do(a) candidato(a)" },
    ],
  },
  {
    title: "Comprovação de renda",
    items: [
      { id: "11", label: "Carteira de Trabalho Digital de todos do grupo familiar a partir dos 16 anos - Emitir PDF" },
      { id: "11.1", label: "CNIS de todos do GF, a partir dos 16 anos - Extrato Previdenciário (CNIS) versão completa" },
      { id: "12", label: "SE Assalariado (Trabalhador Formal) - Holerites (últimos 3 meses)" },
      { id: "13", label: "SE Atividade Informal - Declaração da Renda Bruta (últimos 3 meses - MODELO 1)" },
      { id: "14", label: "SE Desempregados a menos de seis meses" },
      { id: "14.1", label: "Demonstrativo do Recebimento do FGTS" },
      { id: "14.2", label: "Extrato de Recebimento de Seguro Desemprego" },
      { id: "14.3", label: "Rescisão Contratual" },
      { id: "15", label: "SE Estagiário" },
      { id: "15.1", label: "Contrato de ESTÁGIO e aditivo, se houver" },
      { id: "15.2", label: "Holerites (últimos 3 meses)" },
      { id: "16", label: "SE exerce Atividade Autônoma, Liberal ou Rural - Declaração da Renda Bruta (últimos 12 meses - MODELO 2)" },
      { id: "17", label: "SE exerce Empresa (Proprietário ou Sócio)" },
      { id: "17.1", label: "Contrato Social da Empresa e alterações, SE houver" },
      { id: "17.2", label: "Declaração de Imposto de Renda Pessoa Jurídica (IRPJ/Sped) entregue em 2021" },
      { id: "17.3", label: "Declaração com Renda Bruta (últimos 12 meses - MODELO 2)" },
      { id: "17.4", label: "Decore com distribuição de lucros (últimos 12 meses) ou Declaração do contador com CRC" },
      { id: "17.5", label: "Empresa INATIVA: declaração de inatividade dos dois últimos anos" },
      { id: "17.6", label: "Extratos bancários jurídico (últimos 6 meses)" },
      { id: "18", label: "SE Microempreendedor Individual - MEI" },
      { id: "18.1", label: "Declaração com Renda bruta (últimos 12 meses - MODELO 2)" },
      { id: "18.2", label: "Impressão da Consulta da Situação Cadastral da MEI" },
      { id: "18.3", label: "Recibo de entrega da última declaração SIMPLES NACIONAL (DASN SIMEI)" },
      { id: "19", label: "SE não possui rendimento - Declaração de Não Rendimento (maiores de 18 anos - MODELO 3)" },
      { id: "20", label: "SE possui Rendimentos de Aluguel e/ou Arrendamento" },
      { id: "20.1", label: "Contrato de Aluguel e/ou Arrendamento, com firma reconhecida em cartório" },
      { id: "20.2", label: "Comprovante de recebimento de aluguel (últimos 3 meses)" },
      { id: "21", label: "SE Aposentado / Beneficiário INSS / Pensionista - Extrato do Benefício (último recebimento)" },
      { id: "22", label: "SE não possui conta bancária - Emitir Certidão Negativa CCS no site do Banco Central" },
      { id: "23", label: "REGISTRATO - Relatório Relacionamentos Financeiros (CCS)" },
      { id: "23.1", label: "SE mensagem 'Acesso Negado' ao emitir o REGISTRATO - salvar print/foto da tela em PDF" },
      { id: "23.2", label: "Extratos bancários de todas as contas (Corrente, Poupança e/ou Salário - últimos 3 meses)" },
      { id: "23.3", label: "SE entradas além dos rendimentos em Holerite - Declaração justificando entradas (MODELO 11)" },
      { id: "23.4", label: "REGISTRATO - Relatório Meus Endividamentos (SCR)" },
      { id: "24", label: "SE recebe Pensão Alimentícia - Declaração de Valores emitida pelo pagador (MODELO 4)" },
      { id: "25", label: "SE não recebe Pensão Alimentícia - Declaração de Não Recebimento (MODELO 5)" },
      { id: "26", label: "SE recebe Ajuda Financeira de Terceiros - Declaração de Valores emitida pelo benfeitor (MODELO 6)" },
      { id: "27", label: "SE declara Imposto de Renda - Formulário Completo e Recibo de Entrega - 2020 e 2021" },
      { id: "28", label: "SE não declara Imposto de Renda - Emitir Consulta Restituição IRPF 2020 e 2021" },
    ],
  },
  {
    title: "Comprovação patrimonial",
    items: [
      { id: "29", label: "SE proprietário de imóvel urbano - IPTU 2022 e/ou Certidão de Valor de Venal" },
      { id: "30", label: "SE proprietário de imóvel rural - Formulário Completo e Recibo de Entrega DITR exercício 2021" },
      { id: "31", label: "SE possui imóvel cedido - Declaração de Cessão emitida pelo cedente (MODELO 7)" },
      { id: "31.1", label: "IPTU 2022 e/ou Certidão de Valor de Venal do Cedente (ou documento que comprove propriedade)" },
      { id: "32", label: "SE possui imóvel financiado - Contrato de Financiamento e última parcela paga" },
      { id: "33", label: "SE reside em imóvel alugado" },
      { id: "33.1", label: "Contrato e/ou Declaração de Locação (endereço e valor) com firma do locador reconhecida em cartório" },
      { id: "33.2", label: "Recibo de pagamento (últimos 3 meses)" },
      { id: "34", label: "Veículos" },
      { id: "34.1", label: "Certidão de Propriedade (positiva ou negativa) de Veículo - DETRAN (todos do GF com CPF)" },
      { id: "34.2", label: "Documento de Licenciamento de Veículo (porte obrigatório)" },
      { id: "34.3", label: "Emitir Tabela FIPE" },
      { id: "34.4", label: "Nota fiscal de compra do veículo, SE 0km ou semi-novo em revendedora" },
      { id: "35", label: "SE possui veículo financiado - Comprovante de Financiamento e última parcela paga" },
      { id: "36", label: "SE possui consórcio - Contrato de Adesão e Demonstrativo do valor pago até o momento" },
      { id: "37", label: "Declaração de Bens - Descrição dos bens e valores (MODELO 8)" },
    ],
  },
];
