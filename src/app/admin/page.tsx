"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabaseClient"
import { ImagePlus, Link as LinkIcon, Tag, Type, Loader2, Trash2, Edit2, Plus, Gift, Lock, Home } from "lucide-react"

type GiftItem = {
  id: string
  title: string
  price: number
  image_url: string
  purchase_url: string
  status: 'available' | 'purchased'
  is_pix: boolean
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState(false)

  const [gifts, setGifts] = useState<GiftItem[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [purchaseUrl, setPurchaseUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState("")
  const [isPix, setIsPix] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('isAdminAuth') === 'true') {
      setIsAuthenticated(true)
    }
    fetchGifts()
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === "Taciel@2205") {
      setIsAuthenticated(true)
      setAuthError(false)
      sessionStorage.setItem('isAdminAuth', 'true')
    } else {
      setAuthError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('isAdminAuth')
  }

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
      setIsLoadingList(false)
    }
  }

  const handleEdit = (gift: GiftItem) => {
    setEditingId(gift.id)
    setTitle(gift.title)
    setPrice(gift.price.toString())
    setPurchaseUrl(gift.purchase_url)
    setIsPix(gift.is_pix || false)
    setExistingImageUrl(gift.image_url)
    setFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle("")
    setPrice("")
    setPurchaseUrl("")
    setIsPix(false)
    setExistingImageUrl("")
    setFile(null)
    setMessage(null)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Certeza que deseja excluir este item?")) return
    
    try {
      const { error } = await supabase.from('gifts').delete().eq('id', id)
      if (error) throw error
      setGifts(gifts.filter(g => g.id !== id))
    } catch (error: any) {
      alert("Erro ao deletar: " + error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !price || !purchaseUrl || (!file && !editingId)) {
      setMessage({ text: "Preencha os campos obrigatórios.", type: "error" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      let finalImageUrl = existingImageUrl

      // If a new file is selected, upload it
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `gifts/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('gifts-images')
          .upload(filePath, file)

        if (uploadError) throw new Error(`Erro ao subir imagem: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('gifts-images')
          .getPublicUrl(filePath)
          
        finalImageUrl = publicUrl
      }

      if (editingId) {
        // Update existing gift
        const { error: updateError } = await supabase
          .from('gifts')
          .update({
            title,
            price: parseFloat(price),
            image_url: finalImageUrl,
            purchase_url: purchaseUrl,
            is_pix: isPix
          })
          .eq('id', editingId)

        if (updateError) throw new Error(`Erro ao atualizar no banco: ${updateError.message}`)
        
        setMessage({ text: "Presente atualizado com sucesso!", type: "success" })
        handleCancelEdit() // Clear form
      } else {
        // Insert new gift
        const { error: insertError } = await supabase
          .from('gifts')
          .insert({
            title,
            price: parseFloat(price),
            image_url: finalImageUrl,
            purchase_url: purchaseUrl,
            status: 'available',
            is_pix: isPix
          })

        if (insertError) throw new Error(`Erro ao salvar no banco: ${insertError.message}`)

        setMessage({ text: "Presente cadastrado com sucesso!", type: "success" })
        
        // Clear form
        setTitle("")
        setPrice("")
        setPurchaseUrl("")
        setFile(null)
        setIsPix(false)
      }

      fetchGifts() // Reload list

    } catch (error: any) {
      setMessage({ text: error.message || "Ocorreu um erro desconhecido", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#3d2b27] p-8 rounded-3xl shadow-xl w-full max-w-md border border-stone-100 dark:border-stone-800 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Área Administrativa</h1>
          <p className="text-stone-600 dark:text-stone-300 mb-8 text-sm">Digite a senha para gerenciar a sua lista de presentes.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className={`w-full p-4 bg-stone-50 dark:bg-stone-900 border rounded-xl outline-none transition-shadow text-center tracking-widest font-mono ${authError ? 'border-red-500 focus:ring-red-500' : 'border-stone-200 dark:border-stone-800 focus:ring-2 focus:ring-[var(--primary)]'}`}
              />
              {authError && <p className="text-red-500 text-xs mt-2 font-medium">Senha incorreta!</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-[var(--primary)] text-white font-bold py-4 px-4 rounded-xl hover:bg-[#724922] transition-colors"
            >
              Acessar Painel
            </button>
          </form>
          
          <div className="mt-8">
            <a href="/" className="text-sm font-medium text-stone-500 hover:text-[var(--primary)] transition-colors underline underline-offset-4">Voltar para a lista</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8 font-sans transition-colors duration-300">
      
      {/* Top Header Controls */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
         <a href="/" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors font-medium shadow-sm">
            <Home className="w-4 h-4" /> Início
         </a>

         <button onClick={handleLogout} className="text-sm font-semibold text-stone-500 hover:text-red-500 transition-colors">
            Sair
         </button>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Formulário (Esquerda) */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#3d2b27] shadow-xl rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-800 sticky top-8">
            <div className="bg-[var(--primary)] text-[var(--primary-foreground)] p-6 text-center">
              <h1 className="text-2xl font-bold">{editingId ? 'Editar Presente' : 'Adicionar Presente'}</h1>
              <p className="text-sm opacity-90 mt-1">{editingId ? 'Altere as informações abaixo' : 'Cadastre os itens da sua lista'}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {message && (
                <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {message.text}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  Imagem do Produto
                  {existingImageUrl && editingId && !file && (
                     <span className="text-xs text-[var(--primary)]">Imagem atual preservada</span>
                  )}
                </label>
                <div className="flex items-center justify-center w-full">
                  <label 
                    htmlFor="dropzone-file" 
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 border-stone-300 dark:border-stone-700 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {file ? (
                         <p className="text-sm font-semibold text-[var(--primary)]">{file.name}</p>
                      ) : existingImageUrl && editingId ? (
                         <>
                            <img src={existingImageUrl} alt="Preview" className="w-16 h-16 object-contain mb-2 rounded shadow-sm" />
                            <p className="mb-2 text-xs text-stone-500">Clique para enviar uma <span className="font-semibold">nova imagem</span></p>
                         </>
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 mb-3 text-stone-400" />
                          <p className="mb-2 text-sm text-stone-500 dark:text-stone-400"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">PNG, JPG, WEBP</p>
                        </>
                      )}
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Título</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Type className="h-5 w-5 text-stone-400" />
                  </div>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow outline-none text-stone-900 dark:text-stone-100" 
                    placeholder="Ex: Jogo de Panelas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Preço</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-5 w-5 text-stone-400" />
                    </div>
                    <input 
                      type="number"
                      step="0.01" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow outline-none text-stone-900 dark:text-stone-100" 
                      placeholder="Ex: 199.90"
                    />
                  </div>
                </div>
                
                {/* URL */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-stone-700 dark:text-stone-300">Link ou PIX</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-stone-400" />
                    </div>
                    <input 
                      type="text" 
                      value={purchaseUrl}
                      onChange={(e) => setPurchaseUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow outline-none text-stone-900 dark:text-stone-100" 
                      placeholder="URL ou Chave PIX"
                    />
                  </div>
                </div>
              </div>

              {/* PIX Checkbox */}
              <div className="flex items-center gap-3 p-4 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800/50">
                <input 
                  type="checkbox" 
                  id="isPix"
                  checked={isPix}
                  onChange={(e) => setIsPix(e.target.checked)}
                  className="w-5 h-5 text-[var(--primary)] border-stone-300 rounded focus:ring-[var(--primary)]"
                />
                <label htmlFor="isPix" className="text-sm text-stone-700 dark:text-stone-300 font-medium cursor-pointer flex-1">
                  É contribuição / PIX (Múltiplas doações, nunca esgota)
                </label>
              </div>

              {editingId ? (
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="w-1/3 bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200 font-semibold py-3 px-4 rounded-xl hover:bg-stone-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-2/3 bg-[var(--primary)] text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:bg-[#724922] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />} 
                    Atualizar Presente
                  </button>
                </div>
              ) : (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[var(--primary)] text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:bg-[#724922] transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} 
                  Adicionar à Lista
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Lista de Presentes (Direita) */}
        <div className="flex-1">
          <div className="bg-white dark:bg-[#3d2b27] shadow-xl rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-800 h-full flex flex-col">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
               <h2 className="text-xl font-bold flex items-center gap-2"><Gift className="text-[var(--primary)]"/> Presentes Cadastrados</h2>
               <span className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-3 py-1 rounded-full text-xs font-bold">{gifts.length}</span>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
              {isLoadingList ? (
                <div className="flex justify-center py-10 opacity-60"><Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]"/></div>
              ) : gifts.length === 0 ? (
                <div className="text-center py-10 opacity-60 text-sm">Nenhum presente cadastrado ainda.</div>
              ) : (
                <div className="space-y-4">
                  {gifts.map(gift => (
                    <div key={gift.id} className="flex gap-4 p-4 border border-stone-100 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-900/30 hover:shadow-md transition-shadow">
                      <div className="w-20 h-20 bg-white dark:bg-[#3d2b27] rounded-xl flex-shrink-0 p-1 border border-stone-200 dark:border-stone-700">
                         <img src={gift.image_url} alt={gift.title} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-stone-900 dark:text-white truncate">{gift.title}</h3>
                        <p className="text-[var(--primary)] font-bold text-sm mt-1">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gift.price)}
                        </p>
                        <div className="flex gap-2 mt-2">
                           {gift.is_pix && <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-bold">PIX</span>}
                           {gift.status === 'purchased' && !gift.is_pix && <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-[10px] px-2 py-0.5 rounded-full font-bold">COMPRADO</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                         <button onClick={() => handleEdit(gift)} className="p-2 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors" title="Editar">
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(gift.id)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors" title="Excluir">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
