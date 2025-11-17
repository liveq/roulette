import { useState, useRef, useEffect } from 'react'
import Roulette from './components/Roulette'
import SettingsMenu from './components/SettingsMenu'
import './App.css'

const DEFAULT_PRIZES = [
  { id: 1, name: '치약,칫솔,구강스프레이(2+1)세트', color: '#FF69B4' }, // 1등
  { id: 2, name: '구강스프레이 단품', color: '#7FFFD4' }, // 2등
  { id: 3, name: '마우스워시 단품', color: '#FFB6C1' } // 3등
]

const DEFAULT_SLOT_COUNT = 10
const DEFAULT_SLOT_CONFIG = [1, 2, 2, 2, 2, 3, 3, 3, 3, 3] // 각 칸에 할당된 등수 (1등 1칸, 2등 4칸, 3등 5칸)

function App() {
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES)
  const [slotCount, setSlotCount] = useState(DEFAULT_SLOT_COUNT)
  const [slotConfig, setSlotConfig] = useState(DEFAULT_SLOT_CONFIG)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentAudio, setCurrentAudio] = useState(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [volume, setVolume] = useState(50) // 초기 볼륨 50%
  const [isVolumeOpen, setIsVolumeOpen] = useState(false) // 볼륨 조절 펼침 상태
  const [isFloatingMenuOpen, setIsFloatingMenuOpen] = useState(false) // 햄버거 메뉴 펼침 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false) // 암호 모달 상태
  const [passwordInput, setPasswordInput] = useState('') // 암호 입력값
  const [spinDuration, setSpinDuration] = useState(5) // 룰렛 회전 시간 (초)
  const [useCustomProbability, setUseCustomProbability] = useState(false) // 커스텀 확률 사용 여부
  const [customProbabilities, setCustomProbabilities] = useState({}) // 각 등수별 커스텀 확률

  const bgmAudioRef = useRef(null)
  const bgmPlaylistRef = useRef([])
  const currentBgmIndexRef = useRef(0)
  const spinningAudioRef = useRef(null)
  const prize1AudioRef = useRef(null)
  const prize2AudioRef = useRef(null)
  const prize3AudioRef = useRef(null)

  useEffect(() => {
    // BGM 파일 6개 랜덤 순서로 재생목록 생성
    const bgmFiles = [
      `${import.meta.env.BASE_URL}audio/bgm1.mp3`,
      `${import.meta.env.BASE_URL}audio/bgm2.mp3`,
      `${import.meta.env.BASE_URL}audio/bgm3.mp3`,
      `${import.meta.env.BASE_URL}audio/bgm4.mp3`,
      `${import.meta.env.BASE_URL}audio/bgm5.mp3`,
      `${import.meta.env.BASE_URL}audio/bgm6.mp3`
    ]

    // 랜덤 셔플
    bgmPlaylistRef.current = bgmFiles.sort(() => Math.random() - 0.5)

    // 첫 번째 BGM 설정
    bgmAudioRef.current = new Audio(bgmPlaylistRef.current[0])
    bgmAudioRef.current.volume = volume / 100
    bgmAudioRef.current.loop = false

    // 곡이 끝나면 다음 곡 재생 (연속재생)
    const handleEnded = () => {
      currentBgmIndexRef.current = (currentBgmIndexRef.current + 1) % bgmPlaylistRef.current.length
      bgmAudioRef.current.src = bgmPlaylistRef.current[currentBgmIndexRef.current]
      bgmAudioRef.current.volume = volume / 100 // 볼륨 재적용
      bgmAudioRef.current.play().catch(() => {})
    }

    bgmAudioRef.current.addEventListener('ended', handleEnded)

    // 사용자 interaction 감지 후 자동재생
    const tryAutoplay = () => {
      bgmAudioRef.current.play().then(() => {
        setIsMusicPlaying(true)
        console.log('✅ 자동재생 성공')
      }).catch(() => {
        console.log('⚠️ 자동재생 차단됨. 첫 클릭 후 재생됩니다.')
        setIsMusicPlaying(false)
      })
    }

    // 1초 후 자동재생 시도
    const autoplayTimer = setTimeout(tryAutoplay, 1000)

    // 사용자 첫 interaction 시 음악 재생 (autoplay 실패 대비)
    const startOnInteraction = () => {
      if (!isMusicPlaying) {
        bgmAudioRef.current.play().then(() => {
          setIsMusicPlaying(true)
          console.log('✅ 사용자 interaction 후 재생')
        }).catch(() => {})
      }
      // 한 번만 실행 후 리스너 제거
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }

    document.addEventListener('click', startOnInteraction, { once: true })
    document.addEventListener('touchstart', startOnInteraction, { once: true })

    spinningAudioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/spinning.mp3`)
    spinningAudioRef.current.loop = true // 룰렛 시간만큼 루프 재생
    prize1AudioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/prize1.mp3`)
    prize2AudioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/prize2.mp3`)
    prize3AudioRef.current = new Audio(`${import.meta.env.BASE_URL}audio/prize3.mp3`)

    return () => {
      clearTimeout(autoplayTimer)
      bgmAudioRef.current?.pause()
      bgmAudioRef.current?.removeEventListener('ended', handleEnded)
      document.removeEventListener('click', startOnInteraction)
      document.removeEventListener('touchstart', startOnInteraction)
    }
  }, [])

  // 볼륨 변경 시 BGM 볼륨 적용
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = volume / 100
    }
  }, [volume])

  const playAudio = (audioRef) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {
      console.log('오디오 재생 실패')
    })
    setCurrentAudio(audioRef.current)
  }

  const toggleMusic = () => {
    if (isMusicPlaying) {
      bgmAudioRef.current?.pause()
      setIsMusicPlaying(false)
    } else {
      bgmAudioRef.current?.play().catch(() => {
        console.log('BGM 재생 실패')
      })
      setIsMusicPlaying(true)
    }
  }

  const handleSpin = () => {
    if (isSpinning) return

    setIsSpinning(true)

    // BGM은 계속 재생, 회전 음악만 추가 재생
    if (spinningAudioRef.current) {
      spinningAudioRef.current.currentTime = 0
      spinningAudioRef.current.play().catch(() => {})
    }
  }

  const handleStop = () => {
    // 수동 멈춤 시 회전 음악 중지
    spinningAudioRef.current?.pause()
  }

  const handleSpinEnd = (winningPrize) => {
    setIsSpinning(false)

    // 회전 음악 중지
    spinningAudioRef.current?.pause()

    // BGM은 계속 재생, 효과음만 추가 재생
    let prizeAudio = null
    if (winningPrize.id === 1) {
      prizeAudio = prize1AudioRef.current
    } else if (winningPrize.id === 2) {
      prizeAudio = prize2AudioRef.current
    } else if (winningPrize.id === 3) {
      prizeAudio = prize3AudioRef.current
    }

    if (prizeAudio) {
      prizeAudio.currentTime = 0
      prizeAudio.play().catch(() => {})
    }
  }

  const handleSettingsClick = () => {
    setPasswordInput('')
    setIsPasswordModalOpen(true)
  }

  const handlePasswordSubmit = () => {
    if (passwordInput === '4444') {
      setIsPasswordModalOpen(false)
      setPasswordInput('')
      setIsMenuOpen(true)
    } else {
      alert('암호가 틀렸습니다.')
      setPasswordInput('')
    }
  }

  return (
    <>
      {/* 좌측 제품 갤러리 */}
      <div className="product-gallery-left">
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D13984.jpg" alt="Coralier Product 1" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D13952.jpg" alt="Coralier Product 2" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D13961.jpg" alt="Coralier Product 3" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D14135.jpg" alt="Coralier Product 4" />
      </div>

      {/* 우측 제품 갤러리 */}
      <div className="product-gallery-right">
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D14408.jpg" alt="Coralier Product 5" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D14075.jpg" alt="Coralier Product 6" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D15079.jpg" alt="Coralier Product 7" />
        <img src="https://coralier.com/wp-content/uploads/2023/05/0412-%EC%BC%90%ED%85%8D14043.jpg" alt="Coralier Product 8" />
      </div>

      <div className="app">
        {/* 상단 코랄리에 로고 */}
        <header className="brand-header">
        <img
          src={`${import.meta.env.BASE_URL}images/new-logo.jpg`}
          alt="CORALIER"
          className="brand-logo"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </header>

        <SettingsMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          prizes={prizes}
          setPrizes={setPrizes}
          slotCount={slotCount}
          setSlotCount={setSlotCount}
          slotConfig={slotConfig}
          setSlotConfig={setSlotConfig}
          spinDuration={spinDuration}
          setSpinDuration={setSpinDuration}
          useCustomProbability={useCustomProbability}
          setUseCustomProbability={setUseCustomProbability}
          customProbabilities={customProbabilities}
          setCustomProbabilities={setCustomProbabilities}
        />

        <Roulette
          prizes={prizes}
          slotCount={slotCount}
          slotConfig={slotConfig}
          onSpin={handleSpin}
          onStop={handleStop}
          onSpinEnd={handleSpinEnd}
          isSpinning={isSpinning}
          spinDuration={spinDuration}
          useCustomProbability={useCustomProbability}
          customProbabilities={customProbabilities}
        />

        {/* 암호 입력 모달 */}
        {isPasswordModalOpen && (
          <div className="password-modal-overlay" onClick={() => {
            setIsPasswordModalOpen(false)
            setPasswordInput('')
          }}>
            <div className="password-modal" onClick={(e) => e.stopPropagation()}>
              <h2>🔐 설정 메뉴</h2>
              <p>암호를 입력하세요</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
                placeholder="암호 입력"
                className="password-input"
                autoFocus
              />
              <div className="password-modal-buttons">
                <button
                  className="password-cancel-button"
                  onClick={() => {
                    setIsPasswordModalOpen(false)
                    setPasswordInput('')
                  }}
                >
                  취소
                </button>
                <button
                  className="password-submit-button"
                  onClick={handlePasswordSubmit}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 플로팅 메뉴 - 햄버거 버튼 */}
        <div className="floating-menu">
          {/* 펼쳐진 버튼들 */}
          {isFloatingMenuOpen && (
            <div className="floating-buttons">
              {/* 설정 버튼 */}
              <button
                className="floating-button settings-button"
                onClick={handleSettingsClick}
                aria-label="설정"
              >
                ⚙️
              </button>

              {/* 음악 재생/정지 버튼 */}
              <button
                className="floating-button music-button"
                onClick={toggleMusic}
                aria-label={isMusicPlaying ? '음악 정지' : '음악 재생'}
              >
                {isMusicPlaying ? '⏸️' : '▶️'}
              </button>

              {/* 볼륨 버튼 */}
              <button
                className="floating-button volume-button"
                onClick={() => setIsVolumeOpen(!isVolumeOpen)}
                aria-label="볼륨 조절"
              >
                🔊
              </button>

              {/* 볼륨 슬라이더 (펼쳐질 때만 표시) */}
              {isVolumeOpen && (
                <div className="volume-control">
                  <div className="volume-label">{volume}%</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="volume-slider"
                  />
                </div>
              )}
            </div>
          )}

          {/* 햄버거 버튼 */}
          <button
            className="hamburger-button"
            onClick={() => setIsFloatingMenuOpen(!isFloatingMenuOpen)}
            aria-label={isFloatingMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          >
            {isFloatingMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </>
  )
}

export default App
