import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Camera,
  CreditCard,
  Landmark,
  LineChart,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  WalletCards,
} from 'lucide-react'
import './App.css'

type PaymentMethod = 'Cartao de credito' | 'Pix' | 'Debito' | 'Dinheiro'
type TransactionType = 'income' | 'expense'

type Transaction = {
  id: string
  type: TransactionType
  title: string
  amount: number
  category: string
  paymentMethod: PaymentMethod
  date: string
  note: string
}

type Bill = {
  id: string
  title: string
  amount: number
  dueDate: string
  paid: boolean
}

type ReceiptDraft = {
  fileName: string
  guessTitle: string
  guessAmount: number
  guessMethod: PaymentMethod
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const paymentMethods: PaymentMethod[] = [
  'Cartao de credito',
  'Pix',
  'Debito',
  'Dinheiro',
]

const initialTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'income',
    title: 'Salario',
    amount: 3200,
    category: 'Trabalho',
    paymentMethod: 'Pix',
    date: '2026-05-05',
    note: 'Entrada fixa mensal',
  },
  {
    id: 't2',
    type: 'expense',
    title: 'Mercado',
    amount: 412.9,
    category: 'Casa',
    paymentMethod: 'Debito',
    date: '2026-05-07',
    note: 'Compra da semana',
  },
  {
    id: 't3',
    type: 'expense',
    title: 'Streaming e apps',
    amount: 89.8,
    category: 'Assinaturas',
    paymentMethod: 'Cartao de credito',
    date: '2026-05-08',
    note: 'Servicos digitais',
  },
]

const initialBills: Bill[] = [
  {
    id: 'b1',
    title: 'Internet',
    amount: 119.9,
    dueDate: '2026-05-12',
    paid: false,
  },
  {
    id: 'b2',
    title: 'Cartao Nubank',
    amount: 684.3,
    dueDate: '2026-05-17',
    paid: false,
  },
  {
    id: 'b3',
    title: 'Aluguel',
    amount: 980,
    dueDate: '2026-05-10',
    paid: true,
  },
]

const news = [
  {
    title: 'Tesouro Selic: onde entra na reserva de emergencia',
    tag: 'Renda fixa',
    time: '5 min',
  },
  {
    title: 'Como separar dinheiro de boletos, lazer e futuro',
    tag: 'Organizacao',
    time: '4 min',
  },
  {
    title: 'Fundos imobiliarios sem misterio para iniciantes',
    tag: 'Investimentos',
    time: '7 min',
  },
]

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function App() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    'finflow-transactions',
    initialTransactions,
  )
  const [bills, setBills] = useLocalStorage<Bill[]>('finflow-bills', initialBills)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft | null>(null)

  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as TransactionType,
    title: '',
    amount: '',
    category: '',
    paymentMethod: 'Pix' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const [billForm, setBillForm] = useState({
    title: '',
    amount: '',
    dueDate: new Date().toISOString().slice(0, 10),
  })

  const summary = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const expenses = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const openBills = bills
      .filter((bill) => !bill.paid)
      .reduce((sum, bill) => sum + bill.amount, 0)
    const balance = income - expenses - openBills
    const health =
      balance > income * 0.25 ? 'verde' : balance > 0 ? 'amarelo' : 'vermelho'

    const byPayment = paymentMethods.map((method) => ({
      method,
      total: transactions
        .filter(
          (transaction) =>
            transaction.type === 'expense' && transaction.paymentMethod === method,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))

    return { income, expenses, openBills, balance, health, byPayment }
  }, [bills, transactions])

  const aiMessage = useMemo(() => {
    if (summary.health === 'verde') {
      return 'Voce esta no verde. Da para separar uma parte para reserva antes de gastar com lazer.'
    }

    if (summary.health === 'amarelo') {
      return 'Voce ainda fecha positivo, mas precisa segurar gastos variaveis nos proximos dias.'
    }

    return 'Alerta vermelho. Seus gastos e boletos em aberto passaram das entradas previstas.'
  }, [summary.health])

  function addTransaction() {
    const amount = Number(transactionForm.amount)
    if (!transactionForm.title.trim() || !amount) return

    setTransactions([
      {
        id: crypto.randomUUID(),
        type: transactionForm.type,
        title: transactionForm.title.trim(),
        amount,
        category: transactionForm.category.trim() || 'Sem categoria',
        paymentMethod: transactionForm.paymentMethod,
        date: transactionForm.date,
        note: transactionForm.note.trim(),
      },
      ...transactions,
    ])

    setTransactionForm({
      type: 'expense',
      title: '',
      amount: '',
      category: '',
      paymentMethod: 'Pix',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    })
  }

  function addBill() {
    const amount = Number(billForm.amount)
    if (!billForm.title.trim() || !amount) return

    setBills([
      {
        id: crypto.randomUUID(),
        title: billForm.title.trim(),
        amount,
        dueDate: billForm.dueDate,
        paid: false,
      },
      ...bills,
    ])

    setBillForm({
      title: '',
      amount: '',
      dueDate: new Date().toISOString().slice(0, 10),
    })
  }

  function handleReceipt(file: File | undefined) {
    if (!file) return

    setReceiptDraft({
      fileName: file.name,
      guessTitle: 'Comprovante importado',
      guessAmount: 79.9,
      guessMethod: 'Pix',
    })
  }

  function approveReceipt() {
    if (!receiptDraft) return

    setTransactionForm({
      type: 'expense',
      title: receiptDraft.guessTitle,
      amount: String(receiptDraft.guessAmount),
      category: 'Detectado pela IA',
      paymentMethod: receiptDraft.guessMethod,
      date: new Date().toISOString().slice(0, 10),
      note: `Arquivo: ${receiptDraft.fileName}`,
    })
    setReceiptDraft(null)
    setActiveTab('lancamentos')
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>FinFlow</strong>
            <span>dinheiro sem drama</span>
          </div>
        </div>

        <nav>
          <button
            className={activeTab === 'dashboard' ? 'is-active' : ''}
            onClick={() => setActiveTab('dashboard')}
            type="button"
          >
            <LineChart size={18} /> Dashboard
          </button>
          <button
            className={activeTab === 'lancamentos' ? 'is-active' : ''}
            onClick={() => setActiveTab('lancamentos')}
            type="button"
          >
            <WalletCards size={18} /> Lancamentos
          </button>
          <button
            className={activeTab === 'boletos' ? 'is-active' : ''}
            onClick={() => setActiveTab('boletos')}
            type="button"
          >
            <Bell size={18} /> Boletos
          </button>
          <button
            className={activeTab === 'ia' ? 'is-active' : ''}
            onClick={() => setActiveTab('ia')}
            type="button"
          >
            <Sparkles size={18} /> IA
          </button>
          <button
            className={activeTab === 'news' ? 'is-active' : ''}
            onClick={() => setActiveTab('news')}
            type="button"
          >
            <BookOpen size={18} /> Aprender
          </button>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">controle financeiro inteligente</span>
            <h1>Seu dinheiro, em tempo real.</h1>
          </div>
          <button className="primary-action" type="button" onClick={() => setActiveTab('lancamentos')}>
            <Plus size={18} /> Novo gasto
          </button>
        </header>

        {activeTab === 'dashboard' && (
          <section className="dashboard-grid">
            <article className={`balance-panel ${summary.health}`}>
              <div>
                <span>Status do mes</span>
                <h2>{currency.format(summary.balance)}</h2>
                <p>{aiMessage}</p>
              </div>
              <div className="health-ring">
                <span>{summary.health}</span>
              </div>
            </article>

            <article className="metric-card">
              <span>Ganhos</span>
              <strong>{currency.format(summary.income)}</strong>
              <small>salario, freelas e entradas</small>
            </article>
            <article className="metric-card">
              <span>Gastos</span>
              <strong>{currency.format(summary.expenses)}</strong>
              <small>todos os lancamentos do mes</small>
            </article>
            <article className="metric-card">
              <span>Boletos abertos</span>
              <strong>{currency.format(summary.openBills)}</strong>
              <small>vencimentos ainda nao pagos</small>
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>Gastos por forma de pagamento</h2>
                <CreditCard size={20} />
              </div>
              <div className="payment-bars">
                {summary.byPayment.map((item) => {
                  const max = Math.max(...summary.byPayment.map((payment) => payment.total), 1)
                  return (
                    <div className="payment-row" key={item.method}>
                      <span>{item.method}</span>
                      <div className="bar-track">
                        <div style={{ width: `${(item.total / max) * 100}%` }} />
                      </div>
                      <strong>{currency.format(item.total)}</strong>
                    </div>
                  )
                })}
              </div>
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>Ultimos lancamentos</h2>
                <ReceiptText size={20} />
              </div>
              <div className="list">
                {transactions.slice(0, 5).map((transaction) => (
                  <div className="list-item" key={transaction.id}>
                    <div>
                      <strong>{transaction.title}</strong>
                      <span>
                        {transaction.category} • {transaction.paymentMethod}
                      </span>
                    </div>
                    <b className={transaction.type}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {currency.format(transaction.amount)}
                    </b>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'lancamentos' && (
          <section className="two-column">
            <article className="form-panel">
              <div className="section-title">
                <h2>Novo lancamento</h2>
                <WalletCards size={20} />
              </div>
              <div className="segmented">
                <button
                  className={transactionForm.type === 'expense' ? 'selected' : ''}
                  onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                  type="button"
                >
                  Gasto
                </button>
                <button
                  className={transactionForm.type === 'income' ? 'selected' : ''}
                  onClick={() => setTransactionForm({ ...transactionForm, type: 'income' })}
                  type="button"
                >
                  Ganho
                </button>
              </div>
              <input
                placeholder="Ex: almoço, salario, mercado"
                value={transactionForm.title}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, title: event.target.value })
                }
              />
              <input
                placeholder="Valor"
                inputMode="decimal"
                type="number"
                value={transactionForm.amount}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, amount: event.target.value })
                }
              />
              <input
                placeholder="Categoria"
                value={transactionForm.category}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, category: event.target.value })
                }
              />
              <select
                value={transactionForm.paymentMethod}
                onChange={(event) =>
                  setTransactionForm({
                    ...transactionForm,
                    paymentMethod: event.target.value as PaymentMethod,
                  })
                }
              >
                {paymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
              <input
                type="date"
                value={transactionForm.date}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, date: event.target.value })
                }
              />
              <textarea
                placeholder="Descricao opcional"
                value={transactionForm.note}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, note: event.target.value })
                }
              />
              <button className="primary-action full" type="button" onClick={addTransaction}>
                <Plus size={18} /> Salvar lancamento
              </button>
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>Historico</h2>
                <ReceiptText size={20} />
              </div>
              <div className="list">
                {transactions.map((transaction) => (
                  <div className="list-item" key={transaction.id}>
                    <div>
                      <strong>{transaction.title}</strong>
                      <span>
                        {transaction.date} • {transaction.category} • {transaction.paymentMethod}
                      </span>
                    </div>
                    <b className={transaction.type}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {currency.format(transaction.amount)}
                    </b>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Remover lancamento"
                      onClick={() =>
                        setTransactions(
                          transactions.filter((item) => item.id !== transaction.id),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'boletos' && (
          <section className="two-column">
            <article className="form-panel">
              <div className="section-title">
                <h2>Novo boleto</h2>
                <Bell size={20} />
              </div>
              <input
                placeholder="Nome do boleto"
                value={billForm.title}
                onChange={(event) => setBillForm({ ...billForm, title: event.target.value })}
              />
              <input
                placeholder="Valor"
                inputMode="decimal"
                type="number"
                value={billForm.amount}
                onChange={(event) => setBillForm({ ...billForm, amount: event.target.value })}
              />
              <input
                type="date"
                value={billForm.dueDate}
                onChange={(event) => setBillForm({ ...billForm, dueDate: event.target.value })}
              />
              <button className="primary-action full" type="button" onClick={addBill}>
                <Plus size={18} /> Salvar boleto
              </button>
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>Vencimentos</h2>
                <Landmark size={20} />
              </div>
              <div className="list">
                {bills.map((bill) => (
                  <div className="list-item" key={bill.id}>
                    <div>
                      <strong>{bill.title}</strong>
                      <span>vence em {bill.dueDate}</span>
                    </div>
                    <b>{currency.format(bill.amount)}</b>
                    <button
                      className={`status-toggle ${bill.paid ? 'paid' : ''}`}
                      type="button"
                      onClick={() =>
                        setBills(
                          bills.map((item) =>
                            item.id === bill.id ? { ...item, paid: !item.paid } : item,
                          ),
                        )
                      }
                    >
                      {bill.paid ? 'Pago' : 'Aberto'}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'ia' && (
          <section className="ai-layout">
            <article className="assistant-card">
              <Sparkles size={28} />
              <h2>IA financeira</h2>
              <p>{aiMessage}</p>
              <div className="ai-insights">
                <span>Saldo previsto: {currency.format(summary.balance)}</span>
                <span>Maior risco: boletos em aberto</span>
                <span>Proxima melhoria: conectar OCR real via API</span>
              </div>
            </article>

            <article className="upload-card">
              <div className="section-title">
                <h2>Foto do comprovante</h2>
                <Camera size={20} />
              </div>
              <label className="upload-zone">
                <Camera size={30} />
                <span>Tirar foto ou subir arquivo</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={(event) => handleReceipt(event.target.files?.[0])}
                />
              </label>
              {receiptDraft && (
                <div className="receipt-preview">
                  <strong>IA detectou um possivel gasto</strong>
                  <span>{receiptDraft.fileName}</span>
                  <span>
                    {currency.format(receiptDraft.guessAmount)} • {receiptDraft.guessMethod}
                  </span>
                  <button className="primary-action full" type="button" onClick={approveReceipt}>
                    Usar dados detectados
                  </button>
                </div>
              )}
            </article>
          </section>
        )}

        {activeTab === 'news' && (
          <section className="learn-grid">
            {news.map((item) => (
              <article className="learn-card" key={item.title}>
                <span>{item.tag}</span>
                <h2>{item.title}</h2>
                <p>Resumo jovem, direto e facil de entender. Em producao, essa aba puxa links reais.</p>
                <button type="button">
                  <BookOpen size={17} /> Ler resumo
                </button>
                <small>{item.time} de leitura</small>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}

export default App
