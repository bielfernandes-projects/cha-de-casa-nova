"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabaseClient"
import { Gift, ExternalLink, MessageCircleHeart, CheckCircle2, User, Copy, Check, QrCode, Home as HomeIcon } from "lucide-react"

type GiftItem = {
  id: string
  title: string
  price: number
  image_url: string
  purchase_url: string
  status: 'available' | 'purchased'
  buyer_message?: string
  buyer_name?: string
  is_pix?: boolean
  notes?: string
}

export default function Home() {
  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modals State
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null)
  const [redirectGift, setRedirectGift] = useState<GiftItem | null>(null) 
  const [pixGift, setPixGift] = useState<GiftItem | null>(null) // Modal PIX
  
  const [buyerName, setBuyerName] = useState("")
  const [buyerMessage, setBuyerMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Track which gifts were clicked (intent to buy)
  const [intentToBuy, setIntentToBuy] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchGifts()
  }, [])

  const fetchGifts = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setGifts(data || [])
    } catch (error) {
      console.error("Erro ao buscar presentes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToStore = (gift: GiftItem) => {
    if (gift.is_pix) {
      setPixGift(gift)
    } else {
      setRedirectGift(gift)
    }
  }

  const handleConfirmRedirect = () => {
    if (!redirectGift) return
    window.open(redirectGift.purchase_url, '_blank')
    setIntentToBuy(prev => ({ ...prev, [redirectGift.id]: true }))
    setRedirectGift(null)
  }

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGift) return

    if (!buyerName.trim()) {
      alert("Por favor, nos conte seu nome!")
      return
    }

    setIsSubmitting(true)
    
    const updatedName = selectedGift.buyer_name 
      ? `${selectedGift.buyer_name} |SPLIT| ${buyerName}` 
      : buyerName;
      
    const updatedMessage = selectedGift.buyer_message 
      ? `${selectedGift.buyer_message} |SPLIT| ${buyerMessage}` 
      : buyerMessage;

    const newStatus = selectedGift.is_pix ? 'available' : 'purchased';

    try {
      const { error } = await supabase
        .from('gifts')
        .update({ 
          status: newStatus, 
          buyer_name: updatedName,
          buyer_message: updatedMessage 
        })
        .eq('id', selectedGift.id)

      if (error) throw error

      setGifts(gifts.map(g => g.id === selectedGift.id ? { 
        ...g, 
        status: newStatus, 
        buyer_name: updatedName,
        buyer_message: updatedMessage
      } : g))
      
      setSelectedGift(null)
      setBuyerName("")
      setBuyerMessage("")
      
    } catch (error) {
      console.error("Erro ao confirmar compra:", error)
      alert("Ocorreu um erro ao confirmar a compra. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPix = async (pixKey: string) => {
    try {
       await navigator.clipboard.writeText(pixKey);
       setCopied(true);
       setTimeout(() => setCopied(false), 2000);
    } catch (err) {
       console.error('Falha ao copiar', err);
    }
  }

  const handlePixDone = () => {
    if (!pixGift) return;
    setIntentToBuy(prev => ({ ...prev, [pixGift.id]: true }));
    const giftToConfirm = pixGift;
    setPixGift(null);
    setSelectedGift(giftToConfirm);
  }

  const renderAllMessages = () => {
    const allMessages: { id: string, title: string, text: string }[] = [];
    
    gifts.forEach(g => {
      if (g.buyer_message) {
        const messages = g.buyer_message.split('|SPLIT|').map(m => m.trim()).filter(m => m);
        messages.forEach((msg, idx) => {
          allMessages.push({
            id: `${g.id}-${idx}`,
            title: g.title,
            text: msg
          });
        });
      }
    });

    return allMessages;
  }

  const allMessages = renderAllMessages();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-spin text-[var(--primary)] text-4xl">
           <Gift className="w-12 h-12" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] selection:bg-[var(--primary)] selection:text-white pb-20">
      
      {/* Header */}
      <header className="pt-24 pb-16 px-6 text-center max-w-3xl mx-auto">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl text-[var(--primary)] mb-6 tracking-wide drop-shadow-sm" 
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Nosso Chá de Casa Nova
        </h1>
        <div className="flex items-center justify-center gap-3 mb-6 text-2xl md:text-3xl font-medium text-stone-700 dark:text-stone-300">
           <span>Biel</span>
           <HomeIcon className="w-6 h-6 text-[var(--primary)]" />
           <span>Tatá</span>
        </div>
        <div className="w-16 h-[1px] bg-[var(--primary)] mx-auto mb-6 opacity-40"></div>
        <p className="text-lg md:text-xl text-stone-600 dark:text-stone-300 leading-relaxed font-light">
          Estamos preparando nosso novo cantinho com todo o amor do mundo e a sua presença, 
          mesmo que de longe, torna tudo mais especial. Criamos esta lista para os amigos e familiares 
          que quiserem nos presentear enquanto montamos o nosso lar. <br/><br/>
          Sinta-se à vontade para escolher um mimo e pede o envio pra sua casa, assim é mais fácil de marcar sua visita na nossa casinha hehe, e por favor, deixa uma mensagem maneira pra gente! 🤍
        </p>
      </header>

      {/* Grid */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {gifts.map((gift) => {
            const isPurchased = gift.status === 'purchased' && !gift.is_pix
            const hasIntent = intentToBuy[gift.id]

            return (
              <div 
                key={gift.id} 
                className={`relative bg-white dark:bg-[#3d2b27] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100 dark:border-stone-800 flex flex-col ${isPurchased ? 'grayscale opacity-75' : 'group hover:-translate-y-1'}`}
              >
                {/* Image container */}
                <div className="relative h-64 w-full bg-white dark:bg-[#3d2b27] flex-shrink-0 overflow-hidden p-4">
                   <img 
                    src={gift.image_url} 
                    alt={gift.title} 
                    className="w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  {isPurchased && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-3xl">
                      <div className="bg-white/90 text-stone-900 px-6 py-2 rounded-full font-bold flex items-center gap-2 transform -rotate-12 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Comprado
                      </div>
                    </div>
                  )}
                  {gift.is_pix && (
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      Contribuição PIX
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-semibold text-xl mb-2 line-clamp-2" title={gift.title}>{gift.title}</h3>
                  {gift.notes && <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">{gift.notes}</p>}
                  <p className="text-2xl font-bold text-[var(--primary)] mb-2">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.price)}
                  </p>
                  
                  <div className="mt-auto pt-4 space-y-3">
                    {!isPurchased && (
                       <button 
                        onClick={() => handleGoToStore(gift)}
                        className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium py-3 px-4 rounded-xl hover:bg-stone-800 dark:hover:bg-white transition-colors flex justify-center items-center gap-2"
                      >
                        {gift.is_pix ? "Detalhes da Contribuição" : "Ir para a Loja"} {gift.is_pix ? <QrCode className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                      </button>
                    )}

                    {!isPurchased && (hasIntent || gift.is_pix) && (
                      <button 
                        onClick={() => setSelectedGift(gift)}
                        className="w-full bg-[var(--primary)] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#724922] transition-colors flex justify-center items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-2"
                      >
                        {gift.is_pix ? "Já Contribuí!" : "Já Comprei"} <Gift className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {gifts.length === 0 && (
          <div className="text-center py-20 opacity-60">
            <Gift className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>A lista de presentes ainda está vazia.</p>
          </div>
        )}

        {/* Mural de Recados */}
        {allMessages.length > 0 && (
          <section className="mt-32 border-t border-stone-200 dark:border-stone-800 pt-20">
            <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-3">
              <MessageCircleHeart className="text-[var(--primary)]" />
              Mural de Recados
            </h2>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {allMessages.map(msg => (
                  <div key={msg.id} className="break-inside-avoid bg-white dark:bg-[#3d2b27] p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800 flex flex-col h-full">
                    <p className="text-stone-700 dark:text-stone-200 italic mb-4 break-words whitespace-pre-wrap overflow-hidden flex-1 relative z-10 leading-relaxed font-medium">"{msg.text}"</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800/50 text-xs font-semibold opacity-60 uppercase tracking-wider mt-auto">
                      <span>Para:</span>
                      <span className="truncate">{msg.title}</span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>

      <footer className="text-center pt-20 pb-8 opacity-40 hover:opacity-100 transition-opacity">
        <a href="/admin" className="text-xs font-semibold uppercase tracking-widest hover:text-[var(--primary)] transition-colors">
          Acesso Administrativo
        </a>
      </footer>
      {pixGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#3d2b27] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            
            <h2 className="text-2xl font-bold mb-2 text-[var(--primary)] flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6" /> Contribuição via PIX
            </h2>
            
            <p className="text-stone-600 dark:text-stone-300 mb-6 text-sm">
               Você escolheu contribuir para: <br/><strong className="text-stone-900 dark:text-white mt-1 block">{pixGift.title}</strong>
               <span className="block mt-2 text-[var(--primary)] font-medium italic">contribua com o valor que puder</span>
            </p>

            <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-6 mb-6 border border-stone-100 dark:border-stone-800">
               <div className="w-48 h-48 mx-auto bg-white border border-stone-200 rounded-xl flex items-center justify-center overflow-hidden mb-4 p-2 shadow-inner">
                   <img 
                    src="/qrcode-pix.jpeg" 
                    alt="QR Code PIX" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback caso a imagem não exista
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const placeholder = document.createElement('div');
                        placeholder.className = "opacity-30 text-stone-400 text-center flex flex-col items-center";
                        placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-16 h-16 mb-2"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><rect width="1" height="1" x="16" y="16"/><rect width="1" height="1" x="8" y="10"/><rect width="1" height="1" x="10" y="8"/><rect width="1" height="1" x="14" y="14"/><rect width="1" height="1" x="10" y="14"/><rect width="1" height="1" x="14" y="10"/><rect width="1" height="1" x="10" y="11"/><rect width="1" height="1" x="11" y="10"/></svg><span class="text-xs">QR Code não encontrado</span>';
                        parent.appendChild(placeholder);
                      }
                    }}
                   />
               </div>

               <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2">Pix Copia e Cola / Chave</p>
               
               <div className="flex items-center bg-white dark:bg-[#3d2b27] border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-sm">
                  <input 
                    type="text" 
                    readOnly 
                    value="gabrielcastor2206@gmail.com" 
                    className="flex-1 bg-transparent p-3 text-sm font-mono text-stone-800 dark:text-stone-200 outline-none w-full truncate"
                  />
                  <button 
                    onClick={() => handleCopyPix("gabrielcastor2206@gmail.com")}
                    className="p-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-300 border-l border-stone-200 dark:border-stone-700 flex items-center justify-center min-w-[50px]"
                    title="Copiar Chave PIX"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
               </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setPixGift(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handlePixDone}
                className="flex-1 bg-[var(--primary)] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#724922] transition-colors shadow-lg"
              >
                Já contribui!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Redirecionamento da Loja */}
      {redirectGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#3d2b27] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 text-center">
            <h2 className="text-2xl font-bold mb-4 text-[var(--primary)]">Quase lá! 🛒</h2>
            <p className="text-stone-700 dark:text-stone-200 mb-8 leading-relaxed font-medium">
              Vamos te redirecionar para a loja desse produto. <br/><br/>
              Quando concluir a compra, <strong>volta aqui</strong> pra nos informar e deixar uma mensagem pra gente. 
              <br/><br/>
              MUITO OBRIGADO POR FAZER PARTE DESSE MOMENTO! 🤍
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setRedirectGift(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmRedirect}
                className="flex-1 bg-[var(--primary)] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#724922] transition-colors flex justify-center items-center gap-2"
              >
                Entendi! <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Purchase */}
      {selectedGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#3d2b27] rounded-3xl max-w-md w-full p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">Muito Obrigado! 🤎</h2>
            <p className="text-stone-600 dark:text-stone-300 mb-6 text-sm">
              Ficamos imensamente felizes com a sua contribuição para: <strong className="text-stone-900 dark:text-white block mt-1">{selectedGift.title}</strong>
            </p>

            <form onSubmit={handleConfirmPurchase}>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Seu nome
                </label>
                <input 
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow outline-none text-stone-900 dark:text-stone-100" 
                  placeholder="Como devemos lhe chamar?"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300 flex items-center gap-2">
                  <MessageCircleHeart className="w-4 h-4" />
                  Deixe uma mensagem para nós (opcional)
                </label>
                <textarea 
                  value={buyerMessage}
                  onChange={(e) => setBuyerMessage(e.target.value)}
                  className="w-full p-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow outline-none text-stone-900 dark:text-stone-100 min-h-[120px] resize-y" 
                  placeholder="Escreva suas felicitações aqui..."
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setSelectedGift(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 font-medium hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 w-full bg-[var(--primary)] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#724922] transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isSubmitting ? "Enviando..." : "Confirmar Presente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
