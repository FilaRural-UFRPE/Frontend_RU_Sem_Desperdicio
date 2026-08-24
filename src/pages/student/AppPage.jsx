import { useState } from 'react'
import { Smartphone, Download, CheckCircle, Globe } from 'lucide-react'

function detectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || window.opera || ''

  let os = 'unknown'
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) os = 'ios'
  else if (/android/i.test(ua)) os = 'android'
  else if (/Mac|Macintosh/.test(ua)) os = 'macos'
  else if (/Windows/.test(ua)) os = 'windows'
  else if (/Linux/.test(ua)) os = 'linux'

  let browser = 'unknown'
  if (/edg/i.test(ua)) browser = 'edge'
  else if (/opr\//i.test(ua)) browser = 'opera'
  else if (/samsung/i.test(ua)) browser = 'samsung'
  else if (/firefox/i.test(ua)) browser = 'firefox'
  else if (/crios|crmo/i.test(ua)) browser = 'chrome'
  else if (/chrome|chromium/i.test(ua)) browser = 'chrome'
  else if (/safari/i.test(ua)) browser = 'safari'

  return { os, browser }
}

function getPlatformIcon(platform) {
  if (platform.os === 'ios') return '🍎'
  if (platform.os === 'android') return '🤖'
  return '📱'
}

function getPlatformName(platform) {
  if (platform.os === 'ios') return 'iOS (iPhone)'
  if (platform.os === 'android') return 'Android'
  return 'seu dispositivo'
}

function getBrowserName(browser) {
  const names = {
    safari: 'Safari',
    chrome: 'Chrome',
    firefox: 'Firefox',
    edge: 'Edge',
    opera: 'Opera',
    samsung: 'Samsung Internet',
  }
  return names[browser] || 'navegador'
}

function getSteps(platform) {
  if (platform.os === 'ios') {
    return [
      { step: 1, text: 'Abra este site no Safari (o app só instala pelo Safari no iPhone)' },
      { step: 2, text: 'Toque no ícone de compartilhar (quadrado com seta ↑)' },
      { step: 3, text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
      { step: 4, text: 'Confirme tocando em "Adicionar"' },
      { step: 5, text: 'Pronto! O app aparecerá na sua tela inicial' },
    ]
  }
  if (platform.browser === 'samsung') {
    return [
      { step: 1, text: 'Toque no ícone de menu (☰) na barra inferior' },
      { step: 2, text: 'Toque em "Adicionar página a" e depois "Tela inicial"' },
      { step: 3, text: 'Confirme tocando em "Adicionar"' },
      { step: 4, text: 'Pronto! O app aparecerá na sua tela inicial' },
    ]
  }
  return [
    { step: 1, text: `Abra este site no ${getBrowserName(platform.browser)}` },
    { step: 2, text: 'Toque nos três pontinhos (⋮) no canto superior' },
    { step: 3, text: 'Toque em "Adicionar à tela inicial"' },
    { step: 4, text: 'Confirme tocando em "Adicionar"' },
    { step: 5, text: 'Pronto! O app aparecerá na sua tela inicial' },
  ]
}

export default function AppPage() {
  const [detected] = useState(detectPlatform)
  const [showTutorial, setShowTutorial] = useState(false)
  const [manualOs, setManualOs] = useState(null)

  const effectiveOs = manualOs || detected.os
  const effectiveBrowser = manualOs ? 'chrome' : detected.browser
  const effectivePlatform = { os: effectiveOs, browser: effectiveBrowser }
  const steps = getSteps(effectivePlatform)
  const isDetected = !manualOs && detected.os !== 'unknown'

  const needsSafari = effectiveOs === 'ios' && detected.browser !== 'safari'

  const handleInstall = () => {
    setShowTutorial(true)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-ru-charcoal">Aplicativo da Smartru!</h1>
        <p className="text-ru-muted font-body text-sm mt-1">Instale o app no seu celular</p>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-br from-ru-blue to-blue-700 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Smartphone size={28} />
          </div>
          <div>
            <p className="font-display font-bold text-lg">RU Sem Desperdício</p>
            <p className="text-white/90 text-sm font-body">Agende refeições e acompanhe filas</p>
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="w-full bg-white text-ru-blue font-body font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
        >
          <Download size={18} />
          Instalar agora
        </button>
      </div>

      {/* Detecção automática */}
      {isDetected && (
        <div className="card mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{getPlatformIcon(detected)}</span>
            <div>
              <p className="font-body font-medium text-ru-charcoal text-sm">
                Detectamos: {getPlatformName(detected)} · {getBrowserName(detected.browser)}
              </p>
              <p className="text-xs text-ru-muted font-body">Siga o tutorial abaixo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setManualOs(detected.os === 'ios' ? 'android' : 'ios')}
              className="text-xs font-body text-ru-blue hover:underline"
            >
              {detected.os === 'ios' ? 'Android?' : 'iOS?'}
            </button>
          </div>
        </div>
      )}

      {/* Fallback quando não detecta */}
      {!isDetected && (
        <div className="card mb-4">
          <p className="font-body font-medium text-ru-charcoal text-sm mb-3">
            Qual seu dispositivo?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setManualOs('ios')}
              className={`flex-1 py-3 rounded-xl font-body font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                effectiveOs === 'ios'
                  ? 'bg-ru-blue text-white'
                  : 'bg-ru-cream text-ru-charcoal hover:bg-ru-cream-dark'
              }`}
            >
              🍎 iOS
            </button>
            <button
              onClick={() => setManualOs('android')}
              className={`flex-1 py-3 rounded-xl font-body font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                effectiveOs === 'android'
                  ? 'bg-ru-blue text-white'
                  : 'bg-ru-cream text-ru-charcoal hover:bg-ru-cream-dark'
              }`}
            >
              🤖 Android
            </button>
          </div>
        </div>
      )}

      {/* Alerta: iOS sem Safari */}
      {needsSafari && (
        <div className="card mb-4 border-2 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe size={15} className="text-amber-600" />
            </div>
            <div>
              <p className="font-body font-medium text-ru-charcoal text-sm">
                Você está no {getBrowserName(detected.browser)}
              </p>
              <p className="font-body text-ru-charcoal text-xs mt-1">
                No iPhone, o app só pode ser instalado pelo <strong>Safari</strong>. Abra este link no Safari
                (copie o endereço e cole na barra de endereço do Safari) para instalar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial */}
      {showTutorial && (
        <div className="card mb-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{getPlatformIcon(effectivePlatform)}</span>
            <h3 className="font-display font-semibold text-ru-charcoal">
              Como instalar no {getPlatformName(effectivePlatform)}
            </h3>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.step} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-ru-blue rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-body font-bold text-xs">{s.step}</span>
                </div>
                <p className="font-body text-ru-charcoal text-sm pt-1">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 bg-emerald-50 rounded-xl flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <p className="text-emerald-700 text-xs font-body">
              Depois de instalado, o app funciona como um aplicativo nativo — rápido, offline e na sua tela inicial!
            </p>
          </div>
        </div>
      )}

      {/* Funcionalidades */}
      <div className="card">
        <h3 className="font-display font-semibold text-ru-charcoal mb-3">O que você pode fazer</h3>
        <div className="space-y-3">
          {[
            { icon: '🍽️', title: 'Agendar refeições', desc: 'Reserve seu prato com antecedência' },
            { icon: '📊', title: 'Ver filas em tempo real', desc: 'Acompanhe a lotação do RU' },
            { icon: '📋', title: 'Cardápio da semana', desc: 'Veja o que será servido' },
            { icon: '🎟️', title: 'Gerenciar vouchers', desc: 'Use vouchers de convidados' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="font-body font-medium text-ru-charcoal text-sm">{item.title}</p>
                <p className="text-xs text-ru-muted font-body">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
