import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  Camera,
  CreditCard,
  Eye,
  Landmark,
  LineChart,
  LogOut,
  Plus,
  ReceiptText,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import './App.css'
import { supabase, supabaseConfigured } from './supabase'

type PaymentMethod = 'Cartao de credito' | 'Pix' | 'Debito' | 'Dinheiro'
type TransactionType = 'income' | 'expense'
type UserRole = 'user' | 'admin'
type AuthView = 'login' | 'signup' | 'reset'

type AppUser = {
  id: string
  name: string
  phoneDdd: string
  phoneNumber: string
  email: string
  password: string
  birthDate: string
  role: UserRole
  createdAt: string
}

type Transaction = {
  id: string
  userId: string
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
  userId: string
  title: string
  amount: number
  dueDate: string
  paid: boolean
}

type Feedback = {
  id: string
  userId: string
  userName: string
  userEmail: string
  message: string
  createdAt: string
}

type ReceiptDraft = {
  fileName: string
  guessTitle: string
  guessAmount: number
  guessMethod: PaymentMethod
}

type NewsItem = {
  title: string
  tag: string
  time: string
  link?: string
}

type RemoteProfile = {
  id: string
  name: string
  phone_ddd: string
  phone_number: string
  email: string
  birth_date: string
  role: UserRole
  created_at: string
}

type RemoteTransaction = {
  id: string
  user_id: string
  type: TransactionType
  title: string
  amount: number | string
  category: string
  payment_method: PaymentMethod
  date: string
  note: string | null
}

type RemoteBill = {
  id: string
  user_id: string
  title: string
  amount: number | string
  due_date: string
  paid: boolean
}

type RemoteFeedback = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  message: string
  created_at: string
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

const expenseCategories = [
  'Alimentacao',
  'Moradia',
  'Transporte',
  'Contas',
  'Cartao',
  'Lazer',
  'Saude',
  'Educacao',
  'Investimentos',
  'Outros',
]

const incomeCategories = [
  'Salario',
  'Freelance',
  'Vendas',
  'Renda extra',
  'Investimentos',
  'Outros',
]

const fallbackNews: NewsItem[] = [
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

function todayBr() {
  return isoToBr(new Date().toISOString().slice(0, 10))
}

function isoToBr(value: string) {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value

  return `${day}/${month}/${year}`
}

function brToIso(value: string) {
  const [day, month, year] = value.split('/')
  if (!day || !month || !year || year.length !== 4) return ''

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function formatDateForDisplay(value: string) {
  return value.includes('-') ? isoToBr(value) : value
}

function formatBrDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(
    Boolean,
  )

  return parts.join('/')
}

function getCategories(type: TransactionType) {
  return type === 'income' ? incomeCategories : expenseCategories
}

function profileFromRemote(profile: RemoteProfile): AppUser {
  return {
    id: profile.id,
    name: profile.name,
    phoneDdd: profile.phone_ddd,
    phoneNumber: profile.phone_number,
    email: profile.email,
    password: '',
    birthDate: profile.birth_date,
    role: profile.role,
    createdAt: profile.created_at,
  }
}

function transactionFromRemote(transaction: RemoteTransaction): Transaction {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    type: transaction.type,
    title: transaction.title,
    amount: Number(transaction.amount),
    category: transaction.category,
    paymentMethod: transaction.payment_method,
    date: transaction.date,
    note: transaction.note ?? '',
  }
}

function billFromRemote(bill: RemoteBill): Bill {
  return {
    id: bill.id,
    userId: bill.user_id,
    title: bill.title,
    amount: Number(bill.amount),
    dueDate: bill.due_date,
    paid: bill.paid,
  }
}

function feedbackFromRemote(feedback: RemoteFeedback): Feedback {
  return {
    id: feedback.id,
    userId: feedback.user_id,
    userName: feedback.user_name,
    userEmail: feedback.user_email,
    message: feedback.message,
    createdAt: feedback.created_at,
  }
}

function fallbackProfileFromEmail(userId: string, email?: string | null): AppUser {
  const safeEmail = email ?? ''

  return {
    id: userId,
    name: safeEmail.split('@')[0] || 'Usuario',
    phoneDdd: '00',
    phoneNumber: '000000000',
    email: safeEmail,
    password: '',
    birthDate: '2000-01-01',
    role: 'user',
    createdAt: new Date().toISOString(),
  }
}

function profileQualityScore(user: AppUser, currentUserId?: string) {
  const hasRealPhone =
    user.phoneDdd !== '00' &&
    user.phoneNumber !== '000000000' &&
    Boolean(user.phoneNumber.trim())
  const hasFullName = user.name.trim().includes(' ')

  return (
    (hasRealPhone ? 10 : 0) +
    (hasFullName ? 4 : 0) +
    (user.id === currentUserId ? 3 : 0) +
    (user.role === 'admin' ? 1 : 0)
  )
}

function calculateAge(birthDate: string) {
  if (!birthDate) return '-'

  const normalizedDate = birthDate.includes('/') ? brToIso(birthDate) : birthDate
  if (!normalizedDate) return '-'

  const birth = new Date(`${normalizedDate}T00:00:00`)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }

  return age
}

function App() {
  const [users, setUsers] = useLocalStorage<AppUser[]>('finflow-users', [])
  const [sessionId, setSessionId] = useLocalStorage<string | null>(
    'finflow-session-id',
    null,
  )
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    'finflow-transactions',
    [],
  )
  const [bills, setBills] = useLocalStorage<Bill[]>('finflow-bills', [])
  const [feedbacks, setFeedbacks] = useLocalStorage<Feedback[]>(
    'finflow-feedbacks',
    [],
  )
  const [news, setNews] = useState<NewsItem[]>(fallbackNews)
  const [newsStatus, setNewsStatus] = useState('Atualizando noticias...')
  const [authView, setAuthView] = useState<AuthView>('login')
  const [authMessage, setAuthMessage] = useState('')
  const [authLoading, setAuthLoading] = useState(supabaseConfigured)
  const [, setDbMessage] = useState(
    supabaseConfigured
      ? 'Banco Supabase conectado.'
      : 'Modo local: configure o Supabase para salvar fora do navegador.',
  )
  const [activeTab, setActiveTab] = useState('dashboard')
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft | null>(null)
  const [suggestionText, setSuggestionText] = useState('')
  const [suggestionMessage, setSuggestionMessage] = useState('')

  const currentUser = users.find((user) => user.id === sessionId) ?? null
  const userTransactions = transactions.filter(
    (transaction) => transaction.userId === currentUser?.id,
  )
  const userBills = bills.filter((bill) => bill.userId === currentUser?.id)
  const visibleFeedbacks =
    currentUser?.role === 'admin'
      ? feedbacks
      : feedbacks.filter((feedback) => feedback.userId === currentUser?.id)

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [signupForm, setSignupForm] = useState({
    name: '',
    phoneDdd: '',
    phoneNumber: '',
    email: '',
    password: '',
    birthDate: '',
  })

  const [resetForm, setResetForm] = useState({
    email: '',
    newPassword: '',
  })

  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as TransactionType,
    title: '',
    amount: '',
    category: expenseCategories[0],
    paymentMethod: 'Pix' as PaymentMethod,
    date: todayBr(),
    note: '',
  })

  const [billForm, setBillForm] = useState({
    title: '',
    amount: '',
    dueDate: todayBr(),
  })

  async function loadRemoteProfile(userId: string) {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      const { data: createdProfile, error: createError } = await supabase.rpc(
        'ensure_profile',
      )

      if (createError || !createdProfile) {
        const { data: authData } = await supabase.auth.getUser()
        const profile = fallbackProfileFromEmail(userId, authData.user?.email)

        setUsers((currentUsers) => {
          const withoutProfile = currentUsers.filter((user) => user.id !== profile.id)
          return [profile, ...withoutProfile]
        })
        setDbMessage('Login liberado. Perfil do banco sera ajustado depois.')
        return profile
      }

      const profile = profileFromRemote(createdProfile as RemoteProfile)
      setUsers((currentUsers) => {
        const withoutProfile = currentUsers.filter((user) => user.id !== profile.id)
        return [profile, ...withoutProfile]
      })
      setDbMessage('Perfil criado automaticamente no banco.')
      return profile
    }

    const profile = profileFromRemote(data as RemoteProfile)
    setUsers((currentUsers) => {
      const withoutProfile = currentUsers.filter((user) => user.id !== profile.id)
      return [profile, ...withoutProfile]
    })

    return profile
  }

  async function loadRemoteProfilesIfAdmin(profile: AppUser) {
    if (!supabase || profile.role !== 'admin') return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers((data as RemoteProfile[]).map(profileFromRemote))
    }
  }

  async function loadRemoteFinancialData(userId: string) {
    if (!supabase) return

    const [transactionsResponse, billsResponse] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false }),
      supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true }),
    ])

    if (!transactionsResponse.error && transactionsResponse.data) {
      setTransactions(
        (transactionsResponse.data as RemoteTransaction[]).map(transactionFromRemote),
      )
    }

    if (!billsResponse.error && billsResponse.data) {
      setBills((billsResponse.data as RemoteBill[]).map(billFromRemote))
    }
  }

  async function loadRemoteFeedback(profile: AppUser) {
    if (!supabase) return

    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (profile.role !== 'admin') {
      query = query.eq('user_id', profile.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setFeedbacks((data as RemoteFeedback[]).map(feedbackFromRemote))
    }
  }

  async function loadRemoteSession(userId: string) {
    const profile = await loadRemoteProfile(userId)
    if (!profile) return

    setSessionId(userId)
    setActiveTab(profile.role === 'admin' ? 'admin' : 'dashboard')
    await Promise.all([
      loadRemoteProfilesIfAdmin(profile),
      loadRemoteFinancialData(userId),
      loadRemoteFeedback(profile),
    ])
  }

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id
      if (userId) {
        loadRemoteSession(userId).finally(() => setAuthLoading(false))
      } else {
        setSessionId(null)
        setAuthLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        loadRemoteSession(session.user.id)
      } else {
        setSessionId(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadNews() {
      try {
        const rssUrl = encodeURIComponent('https://www.infomoney.com.br/feed/')
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`,
        )
        const data = await response.json()

        if (!Array.isArray(data.items)) {
          throw new Error('Fonte sem itens')
        }

        setNews(
          data.items.slice(0, 6).map((item: { title: string; link: string }) => ({
            title: item.title,
            tag: 'Mercado agora',
            time: 'tempo real',
            link: item.link,
          })),
        )
        setNewsStatus('Noticias atualizadas em tempo real via RSS')
      } catch {
        setNews(fallbackNews)
        setNewsStatus('Fonte ao vivo indisponivel agora; exibindo conteudo base')
      }
    }

    loadNews()
    const interval = window.setInterval(loadNews, 1000 * 60 * 10)

    return () => window.clearInterval(interval)
  }, [])

  const summary = useMemo(() => {
    const income = userTransactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const expenses = userTransactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    const openBills = userBills
      .filter((bill) => !bill.paid)
      .reduce((sum, bill) => sum + bill.amount, 0)
    const balance = income - expenses - openBills
    const health =
      income === 0 && expenses === 0 && openBills === 0
        ? 'zerado'
        : balance > income * 0.25
          ? 'verde'
          : balance > 0
            ? 'amarelo'
            : 'vermelho'

    const byPayment = paymentMethods.map((method) => ({
      method,
      total: userTransactions
        .filter(
          (transaction) =>
            transaction.type === 'expense' && transaction.paymentMethod === method,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))

    return { income, expenses, openBills, balance, health, byPayment }
  }, [userBills, userTransactions])

  const aiMessage = useMemo(() => {
    if (summary.health === 'zerado') {
      return 'Sua conta esta zerada. Cadastre seu primeiro ganho ou boleto para a IA montar seu panorama.'
    }

    if (summary.health === 'verde') {
      return 'Voce esta no verde. Da para separar uma parte para reserva antes de gastar com lazer.'
    }

    if (summary.health === 'amarelo') {
      return 'Voce ainda fecha positivo, mas precisa segurar gastos variaveis nos proximos dias.'
    }

    return 'Alerta vermelho. Seus gastos e boletos em aberto passaram das entradas previstas.'
  }, [summary.health])

  const adminUsers = useMemo(() => {
    const usersByEmail = new Map<string, AppUser>()

    users.forEach((user) => {
      const emailKey = user.email.trim().toLowerCase()
      const key = emailKey || user.id
      const savedUser = usersByEmail.get(key)

      if (!savedUser) {
        usersByEmail.set(key, user)
        return
      }

      const savedScore = profileQualityScore(savedUser, currentUser?.id)
      const userScore = profileQualityScore(user, currentUser?.id)

      if (userScore > savedScore) {
        usersByEmail.set(key, user)
      }
    })

    return Array.from(usersByEmail.values())
  }, [currentUser?.id, users])

  function renderNavigation(className: string) {
    return (
      <nav className={className}>
        {currentUser?.role === 'admin' && (
          <button
            className={activeTab === 'admin' ? 'is-active' : ''}
            onClick={() => setActiveTab('admin')}
            type="button"
          >
            <Shield size={18} /> ADM
          </button>
        )}
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
        <button
          className={activeTab === 'sugestoes' ? 'is-active' : ''}
          onClick={() => setActiveTab('sugestoes')}
          type="button"
        >
          <ReceiptText size={18} /> Sugestoes
        </button>
      </nav>
    )
  }

  async function signUp() {
    setAuthMessage('')

    if (
      !signupForm.name.trim() ||
      !signupForm.phoneDdd.trim() ||
      !signupForm.phoneNumber.trim() ||
      !signupForm.email.trim() ||
      !signupForm.password ||
      !brToIso(signupForm.birthDate)
    ) {
      setAuthMessage('Preencha todos os campos. A data deve estar em dd/mm/aaaa.')
      return
    }

    if (
      !supabase &&
      users.some((user) => user.email === signupForm.email.trim().toLowerCase())
    ) {
      setAuthMessage('Este email ja possui cadastro.')
      return
    }

    const newUser: AppUser = {
      id: crypto.randomUUID(),
      name: signupForm.name.trim(),
      phoneDdd: signupForm.phoneDdd.trim(),
      phoneNumber: signupForm.phoneNumber.trim(),
      email: signupForm.email.trim().toLowerCase(),
      password: signupForm.password,
      birthDate: brToIso(signupForm.birthDate),
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: signupForm.password,
        options: {
          data: {
            name: newUser.name,
            phoneDdd: newUser.phoneDdd,
            phoneNumber: newUser.phoneNumber,
            birthDate: newUser.birthDate,
          },
        },
      })

      if (error) {
        const message = error.message.toLowerCase()

        if (message.includes('rate limit')) {
          setAuthMessage(
            'O Supabase bloqueou novos emails por alguns minutos. Tente entrar com a conta ja criada ou espere um pouco.',
          )
          return
        }

        if (message.includes('already registered') || message.includes('already exists')) {
          setAuthMessage('Esse email ja tem conta. Use a aba Entrar.')
          setAuthView('login')
          return
        }

        setAuthMessage(error.message)
        return
      }

      if (!data.session && data.user) {
        setAuthMessage(
          'Cadastro criado. Se o Supabase pedir confirmacao, confirme o email antes de entrar.',
        )
        setAuthView('login')
        return
      }

      if (data.user) {
        await loadRemoteSession(data.user.id)
      }

      setSignupForm({
        name: '',
        phoneDdd: '',
        phoneNumber: '',
        email: '',
        password: '',
        birthDate: '',
      })
      return
    }

    setUsers([newUser, ...users])
    setSessionId(newUser.id)
    setActiveTab('dashboard')
    setSignupForm({
      name: '',
      phoneDdd: '',
      phoneNumber: '',
      email: '',
      password: '',
      birthDate: '',
    })
  }

  async function login() {
    setAuthMessage('')
    const email = loginForm.email.trim().toLowerCase()

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginForm.password,
      })

      if (error || !data.user) {
        const message = error?.message.toLowerCase() ?? ''

        if (message.includes('email not confirmed')) {
          setAuthMessage(
            'Seu email ainda nao foi confirmado. Confirme pelo email ou libere a conta no Supabase.',
          )
          return
        }

        if (message.includes('invalid login credentials')) {
          setAuthMessage(
            'Nao consegui entrar com esse email e senha. Confira a senha ou redefina o acesso.',
          )
          return
        }

        setAuthMessage(error?.message ?? 'Nao consegui fazer login agora.')
        return
      }

      await loadRemoteSession(data.user.id)
      setLoginForm({ email: '', password: '' })
      return
    }

    const user = users.find(
      (item) =>
        item.email === email &&
        item.password === loginForm.password,
    )

    if (!user) {
      setAuthMessage('Email ou senha incorretos.')
      return
    }

    setSessionId(user.id)
    setActiveTab(user.role === 'admin' ? 'admin' : 'dashboard')
    setLoginForm({ email: '', password: '' })
  }

  async function resetPassword() {
    setAuthMessage('')

    if (!resetForm.email.trim() || (!supabase && !resetForm.newPassword)) {
      setAuthMessage(
        supabase
          ? 'Digite o email cadastrado.'
          : 'Digite email e nova senha.',
      )
      return
    }

    const email = resetForm.email.trim().toLowerCase()

    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })

      if (error) {
        setAuthMessage(error.message)
        return
      }

      setResetForm({ email: '', newPassword: '' })
      setAuthView('login')
      setAuthMessage('Enviamos um link de redefinicao para o email cadastrado.')
      return
    }

    const exists = users.some((user) => user.email === email)

    if (!exists) {
      setAuthMessage('Nao encontramos uma conta com esse email.')
      return
    }

    setUsers(
      users.map((user) =>
        user.email === email ? { ...user, password: resetForm.newPassword } : user,
      ),
    )
    setResetForm({ email: '', newPassword: '' })
    setAuthView('login')
    setAuthMessage('Senha redefinida. Entre com a nova senha.')
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setSessionId(null)
    setActiveTab('dashboard')
    setAuthView('login')
  }

  async function addTransaction() {
    if (!currentUser) return

    const amount = Number(transactionForm.amount)
    const isoDate = brToIso(transactionForm.date)
    if (!transactionForm.title.trim() || !amount || !isoDate) return

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      type: transactionForm.type,
      title: transactionForm.title.trim(),
      amount,
      category: transactionForm.category,
      paymentMethod: transactionForm.paymentMethod,
      date: isoDate,
      note: transactionForm.note.trim(),
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: newTransaction.userId,
          type: newTransaction.type,
          title: newTransaction.title,
          amount: newTransaction.amount,
          category: newTransaction.category,
          payment_method: newTransaction.paymentMethod,
          date: newTransaction.date,
          note: newTransaction.note,
        })
        .select()
        .single()

      if (error || !data) return

      setTransactions([
        transactionFromRemote(data as RemoteTransaction),
        ...transactions,
      ])
    } else {
      setTransactions([newTransaction, ...transactions])
    }

    setTransactionForm({
      type: 'expense',
      title: '',
      amount: '',
      category: expenseCategories[0],
      paymentMethod: 'Pix',
      date: todayBr(),
      note: '',
    })
  }

  async function addBill() {
    if (!currentUser) return

    const amount = Number(billForm.amount)
    const isoDate = brToIso(billForm.dueDate)
    if (!billForm.title.trim() || !amount || !isoDate) return

    const newBill: Bill = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      title: billForm.title.trim(),
      amount,
      dueDate: isoDate,
      paid: false,
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('bills')
        .insert({
          user_id: newBill.userId,
          title: newBill.title,
          amount: newBill.amount,
          due_date: newBill.dueDate,
          paid: newBill.paid,
        })
        .select()
        .single()

      if (error || !data) return

      setBills([billFromRemote(data as RemoteBill), ...bills])
    } else {
      setBills([newBill, ...bills])
    }

    setBillForm({
      title: '',
      amount: '',
      dueDate: todayBr(),
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
      category: 'Outros',
      paymentMethod: receiptDraft.guessMethod,
      date: todayBr(),
      note: `Arquivo: ${receiptDraft.fileName}`,
    })
    setReceiptDraft(null)
    setActiveTab('lancamentos')
  }

  async function removeTransaction(transactionId: string) {
    if (supabase) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) return
    }

    setTransactions(transactions.filter((item) => item.id !== transactionId))
  }

  async function toggleBillPaid(bill: Bill) {
    if (supabase) {
      const { error } = await supabase
        .from('bills')
        .update({ paid: !bill.paid })
        .eq('id', bill.id)

      if (error) return
    }

    setBills(
      bills.map((item) =>
        item.id === bill.id ? { ...item, paid: !item.paid } : item,
      ),
    )
  }

  async function addSuggestion() {
    if (!currentUser) return

    const message = suggestionText.trim()
    if (message.length < 6) {
      setSuggestionMessage('Escreva um pouco mais sobre sua ideia.')
      return
    }

    const newFeedback: Feedback = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      message,
      createdAt: new Date().toISOString(),
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: newFeedback.userId,
          user_name: newFeedback.userName,
          user_email: newFeedback.userEmail,
          message: newFeedback.message,
        })
        .select()
        .single()

      if (error) {
        setSuggestionMessage('Ainda preciso criar a tabela de sugestoes no Supabase.')
        return
      }

      setFeedbacks([feedbackFromRemote(data as RemoteFeedback), ...feedbacks])
    } else {
      setFeedbacks([newFeedback, ...feedbacks])
    }

    setSuggestionText('')
    setSuggestionMessage('Sugestao enviada. Valeu por ajudar a melhorar o app.')
  }

  if (authLoading) {
    return (
      <main className="auth-shell">
        <section className="auth-card loading-card">
          <div className="brand">
            <img className="brand-mark" src="/finflow-mark.svg" alt="" />
            <div>
              <strong>FinFlow</strong>
              <span>carregando seu acesso</span>
            </div>
          </div>
          <p>Conectando ao banco de dados...</p>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="auth-shell">
        <section className="auth-hero">
          <div className="auth-logo-lockup">
            <img src="/finflow-logo.svg" alt="FinFlow" />
            <div>
              <strong>FinFlow</strong>
              <span>controle financeiro inteligente</span>
            </div>
          </div>
          <div className="auth-copy">
            <span className="hero-pill">feito para quem quer clareza</span>
            <h1>Controle sua grana sem virar refem de planilha.</h1>
            <p>
              Veja ganhos, gastos, boletos e formas de pagamento em um painel
              simples, bonito e atualizado na hora.
            </p>
          </div>
          <div className="phone-preview" aria-hidden="true">
            <div className="phone-top">
              <span>Saldo do mes</span>
              <strong>R$ 1.893,10</strong>
            </div>
            <div className="preview-card green">
              <span>Pix</span>
              <strong>+ R$ 320,00</strong>
            </div>
            <div className="preview-card pink">
              <span>Cartao</span>
              <strong>- R$ 89,80</strong>
            </div>
            <div className="mini-bars">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="auth-highlights">
            <span>Dashboard em tempo real</span>
            <span>Boletos no radar</span>
            <span>IA financeira</span>
          </div>
        </section>

        <section className="auth-card">
          <p className={`db-status ${supabaseConfigured ? 'online' : ''}`}>
            {supabaseConfigured
              ? 'Banco Supabase conectado.'
              : 'Modo local: configure o Supabase para salvar fora do navegador.'}
          </p>
          <div className="auth-tabs">
            <button
              className={authView === 'login' ? 'selected' : ''}
              type="button"
              onClick={() => setAuthView('login')}
            >
              Entrar
            </button>
            <button
              className={authView === 'signup' ? 'selected' : ''}
              type="button"
              onClick={() => setAuthView('signup')}
            >
              Criar conta
            </button>
          </div>

          {authView === 'login' && (
            <div className="auth-form">
              <h2>Acesse sua conta</h2>
              <input
                placeholder="Email"
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, email: event.target.value })
                }
              />
              <input
                placeholder="Senha"
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
              />
              <button className="primary-action full" type="button" onClick={login}>
                Entrar agora
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setAuthView('reset')}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          {authView === 'signup' && (
            <div className="auth-form">
              <h2>Crie sua conta</h2>
              <input
                placeholder="Nome completo"
                value={signupForm.name}
                onChange={(event) =>
                  setSignupForm({ ...signupForm, name: event.target.value })
                }
              />
              <div className="phone-grid">
                <input
                  placeholder="DDD"
                  inputMode="numeric"
                  maxLength={2}
                  value={signupForm.phoneDdd}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, phoneDdd: event.target.value })
                  }
                />
                <input
                  placeholder="Numero de telefone"
                  inputMode="tel"
                  value={signupForm.phoneNumber}
                  onChange={(event) =>
                    setSignupForm({ ...signupForm, phoneNumber: event.target.value })
                  }
                />
              </div>
              <input
                placeholder="Email"
                type="email"
                value={signupForm.email}
                onChange={(event) =>
                  setSignupForm({ ...signupForm, email: event.target.value })
                }
              />
              <input
                placeholder="Senha"
                type="password"
                value={signupForm.password}
                onChange={(event) =>
                  setSignupForm({ ...signupForm, password: event.target.value })
                }
              />
              <label className="field-label">
                Data de nascimento (dd/mm/aaaa)
                <input
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  maxLength={10}
                  value={signupForm.birthDate}
                  onChange={(event) =>
                    setSignupForm({
                      ...signupForm,
                      birthDate: formatBrDateInput(event.target.value),
                    })
                  }
                />
              </label>
              <p className="security-note">
                Contas novas entram como usuario normal. Acesso ADM so e liberado
                manualmente pelo dono no banco.
              </p>
              <button className="primary-action full" type="button" onClick={signUp}>
                <UserPlus size={18} /> Criar cadastro
              </button>
            </div>
          )}

          {authView === 'reset' && (
            <div className="auth-form">
              <h2>Redefinir senha</h2>
              <input
                placeholder="Email cadastrado"
                type="email"
                value={resetForm.email}
                onChange={(event) =>
                  setResetForm({ ...resetForm, email: event.target.value })
                }
              />
              {!supabaseConfigured && (
                <input
                  placeholder="Nova senha"
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(event) =>
                    setResetForm({ ...resetForm, newPassword: event.target.value })
                  }
                />
              )}
              <button
                className="primary-action full"
                type="button"
                onClick={resetPassword}
              >
                Redefinir senha
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => setAuthView('login')}
              >
                Voltar para login
              </button>
            </div>
          )}

          {authMessage && <p className="auth-message">{authMessage}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Menu principal">
        <div className="brand">
          <img className="brand-mark" src="/finflow-mark.svg" alt="" />
          <div>
            <strong>FinFlow</strong>
            <span>{currentUser.role === 'admin' ? 'painel ADM' : 'dinheiro sem drama'}</span>
          </div>
        </div>

        {renderNavigation('sidebar-nav')}

        <button className="logout-button" type="button" onClick={logout}>
          <LogOut size={17} /> Sair
        </button>
      </aside>

      {renderNavigation('mobile-tabbar')}

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">Ola, {currentUser.name}</span>
            <h1>Seu dinheiro, em tempo real.</h1>
          </div>
          <button
            className="primary-action"
            type="button"
            onClick={() => setActiveTab('lancamentos')}
          >
            <Plus size={18} /> Novo gasto
          </button>
        </header>

        {activeTab === 'admin' && currentUser.role === 'admin' && (
          <section className="admin-grid">
            <article className="metric-card">
              <span>Total de cadastros</span>
              <strong>{adminUsers.length}</strong>
              <small>usuarios criados neste ambiente</small>
            </article>
            <article className="metric-card">
              <span>Contas normais</span>
              <strong>{adminUsers.filter((user) => user.role === 'user').length}</strong>
              <small>pessoas usando dashboard</small>
            </article>
            <article className="metric-card">
              <span>Administradores</span>
              <strong>{adminUsers.filter((user) => user.role === 'admin').length}</strong>
              <small>acesso ao painel ADM</small>
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>Usuarios cadastrados</h2>
                <Users size={20} />
              </div>
              <div className="admin-table">
                <div className="admin-row admin-head">
                  <span>Nome</span>
                  <span>Email</span>
                  <span>Telefone</span>
                  <span>Idade</span>
                  <span>Tipo</span>
                </div>
                {adminUsers.map((user) => (
                  <div className="admin-row" key={user.id}>
                    <span>{user.name}</span>
                    <span>{user.email}</span>
                    <span>
                      ({user.phoneDdd}) {user.phoneNumber}
                    </span>
                    <span>{calculateAge(user.birthDate)} anos</span>
                    <span>{user.role === 'admin' ? 'ADM' : 'Normal'}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

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
                {userTransactions.length === 0 && (
                  <div className="empty-state">Nenhum lancamento ainda.</div>
                )}
                {userTransactions.slice(0, 5).map((transaction) => (
                  <div className="list-item" key={transaction.id}>
                    <div>
                      <strong>{transaction.title}</strong>
                      <span>
                        {transaction.category} - {transaction.paymentMethod}
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
                  onClick={() =>
                    setTransactionForm({
                      ...transactionForm,
                      type: 'expense',
                      category: expenseCategories[0],
                    })
                  }
                  type="button"
                >
                  Gasto
                </button>
                <button
                  className={transactionForm.type === 'income' ? 'selected' : ''}
                  onClick={() =>
                    setTransactionForm({
                      ...transactionForm,
                      type: 'income',
                      category: incomeCategories[0],
                    })
                  }
                  type="button"
                >
                  Ganho
                </button>
              </div>
              <input
                placeholder="Ex: almoco, salario, mercado"
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
              <label className="field-label">
                Categoria
                <select
                value={transactionForm.category}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, category: event.target.value })
                }
                >
                  {getCategories(transactionForm.type).map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
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
                placeholder="Data do lancamento (dd/mm/aaaa)"
                inputMode="numeric"
                maxLength={10}
                value={transactionForm.date}
                onChange={(event) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: formatBrDateInput(event.target.value),
                  })
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
                {userTransactions.length === 0 && (
                  <div className="empty-state">Sua conta comeca zerada. Adicione o primeiro lancamento.</div>
                )}
                {userTransactions.map((transaction) => (
                  <div className="list-item" key={transaction.id}>
                    <div>
                      <strong>{transaction.title}</strong>
                      <span>
                        {formatDateForDisplay(transaction.date)} - {transaction.category} - {transaction.paymentMethod}
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
                      onClick={() => removeTransaction(transaction.id)}
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
                placeholder="Vencimento (dd/mm/aaaa)"
                inputMode="numeric"
                maxLength={10}
                value={billForm.dueDate}
                onChange={(event) =>
                  setBillForm({
                    ...billForm,
                    dueDate: formatBrDateInput(event.target.value),
                  })
                }
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
                {userBills.length === 0 && (
                  <div className="empty-state">Nenhum boleto cadastrado ainda.</div>
                )}
                {userBills.map((bill) => (
                  <div className="list-item" key={bill.id}>
                    <div>
                      <strong>{bill.title}</strong>
                      <span>vence em {formatDateForDisplay(bill.dueDate)}</span>
                    </div>
                    <b>{currency.format(bill.amount)}</b>
                    <button
                      className={`status-toggle ${bill.paid ? 'paid' : ''}`}
                      type="button"
                      onClick={() => toggleBillPaid(bill)}
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
                <span>Atualizacao: instantanea, sem refresh</span>
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
                    {currency.format(receiptDraft.guessAmount)} - {receiptDraft.guessMethod}
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
          <section>
            <div className="news-header">
              <div>
                <span className="eyebrow">educacao financeira</span>
                <h2>Noticias e conteudos atualizados</h2>
              </div>
              <span>{newsStatus}</span>
            </div>
            <div className="learn-grid">
              {news.map((item) => (
                <article className="learn-card" key={item.title}>
                  <span>{item.tag}</span>
                  <h2>{item.title}</h2>
                  <p>Resumo jovem, direto e facil de entender para aprender sem complicar.</p>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer">
                      <Eye size={17} /> Abrir noticia
                    </a>
                  ) : (
                    <button type="button">
                      <BookOpen size={17} /> Ler resumo
                    </button>
                  )}
                  <small>{item.time}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'sugestoes' && (
          <section className="two-column">
            <article className="form-panel">
              <div className="section-title">
                <h2>Enviar sugestao</h2>
                <ReceiptText size={20} />
              </div>
              <p className="helper-text">
                Conte o que voce gostaria de ver no app, o que esta confuso ou qual
                melhoria deixaria sua vida mais facil.
              </p>
              <textarea
                placeholder="Ex: queria uma meta de economia mensal, aviso de boleto vencendo, grafico por categoria..."
                value={suggestionText}
                onChange={(event) => {
                  setSuggestionText(event.target.value)
                  setSuggestionMessage('')
                }}
              />
              <button className="primary-action full" type="button" onClick={addSuggestion}>
                <Plus size={18} /> Enviar sugestao
              </button>
              {suggestionMessage && <p className="auth-message">{suggestionMessage}</p>}
            </article>

            <article className="wide-card">
              <div className="section-title">
                <h2>
                  {currentUser.role === 'admin'
                    ? 'Sugestoes recebidas'
                    : 'Suas sugestoes'}
                </h2>
                <Users size={20} />
              </div>
              <div className="list">
                {visibleFeedbacks.length === 0 && (
                  <div className="empty-state">
                    Nenhuma sugestao enviada ainda. A primeira ideia pode nascer aqui.
                  </div>
                )}
                {visibleFeedbacks.map((feedback) => (
                  <div className="list-item feedback-item" key={feedback.id}>
                    <div>
                      <strong>{feedback.userName}</strong>
                      <span>{feedback.userEmail}</span>
                      <p>{feedback.message}</p>
                    </div>
                    <small>{formatDateForDisplay(feedback.createdAt.slice(0, 10))}</small>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
