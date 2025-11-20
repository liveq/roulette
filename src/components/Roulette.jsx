import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Roulette.css'

function Roulette({ prizes, slotCount, slotConfig, onSpin, onStop, onSpinEnd, isSpinning, spinDuration, useCustomProbability, customProbabilities, resultModalScale }) {
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState(null)
  const wheelRef = useRef(null)
  const spinTimeoutRef = useRef(null)
  const currentWinnerRef = useRef(null)
  const rotationRef = useRef(0) // 최신 rotation 값을 추적하는 ref

  // slotConfig 기반 룰렛 칸 생성
  const getWheelSlots = () => {
    return slotConfig.map((rank, index) => {
      const prize = prizes.find(p => p.id === rank)
      return {
        slotIndex: index,
        rank: rank,
        prize: prize || prizes[0] // 혹시 없으면 첫 번째 상품
      }
    })
  }

  // 슬롯 위치 디버깅 (컴포넌트 로드 시 1회만)
  useEffect(() => {
    const slotAngle = 360 / slotCount
    console.log('=== 룰렛 슬롯 위치 정보 ===')
    console.log('총 슬롯 수:', slotCount, '| 각 슬롯 각도:', slotAngle, '도')
    for (let i = 0; i < Math.min(slotCount, 10); i++) {
      const start = i * slotAngle - slotAngle / 2
      const end = start + slotAngle
      const center = i * slotAngle
      console.log(`슬롯 ${i + 1}: ${start.toFixed(1)}° ~ ${end.toFixed(1)}° (중앙: ${center.toFixed(1)}°)`)
    }
  }, [slotCount])

  // 랜덤 칸 선택
  const getRandomPrize = () => {
    let randomSlotIndex
    let rank

    if (useCustomProbability && Object.keys(customProbabilities).length > 0) {
      // 커스텀 확률 사용: 가중치 기반 랜덤 선택
      console.log('🎯 커스텀 확률 사용 중')

      // 1. 확률에 따라 등수 선택
      const random = Math.random() * 100
      let cumulative = 0
      let selectedRank = null

      for (const prize of prizes) {
        const probability = customProbabilities[prize.id] || 0
        cumulative += probability
        if (random <= cumulative) {
          selectedRank = prize.id
          break
        }
      }

      if (!selectedRank) selectedRank = prizes[0].id

      console.log('📊 확률 추첨 결과:', selectedRank + '등 (랜덤값:', random.toFixed(2), '%)')

      // 2. 해당 등수의 슬롯 중 랜덤 선택
      const slotsWithRank = slotConfig
        .map((r, idx) => ({ rank: r, index: idx }))
        .filter(slot => slot.rank === selectedRank)

      if (slotsWithRank.length === 0) {
        console.warn('⚠️ 해당 등수의 슬롯이 없음. 기본 랜덤 선택')
        randomSlotIndex = Math.floor(Math.random() * slotCount)
        rank = slotConfig[randomSlotIndex]
      } else {
        const randomSlot = slotsWithRank[Math.floor(Math.random() * slotsWithRank.length)]
        randomSlotIndex = randomSlot.index
        rank = selectedRank
      }
    } else {
      // 기본: 균등 랜덤 선택
      randomSlotIndex = Math.floor(Math.random() * slotCount)
      rank = slotConfig[randomSlotIndex]
    }

    const prize = prizes.find(p => p.id === rank)

    console.log('🎲 랜덤 칸 선택:', randomSlotIndex + 1, '/', slotCount)
    console.log('🏆 당첨 등수:', rank + '등')

    return { ...prize, slotIndex: randomSlotIndex }
  }

  const handleSpinClick = () => {
    if (isSpinning) {
      // 회전 중이면 즉시 정지 (애니메이션 중단)
      if (spinTimeoutRef.current) {
        clearTimeout(spinTimeoutRef.current)
        spinTimeoutRef.current = null
      }

      // 회전 음악 중지
      onStop()

      // 즉시 당첨 결과 표시
      if (currentWinnerRef.current) {
        // 회전 애니메이션을 즉시 중단
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'none'
        }

        // 0.5초 후 모달 표시 (사용자가 결과를 볼 수 있도록)
        setTimeout(() => {
          setWinner(currentWinnerRef.current)
          onSpinEnd(currentWinnerRef.current)
        }, 500)
      }
      return
    }

    const winningPrize = getRandomPrize()
    currentWinnerRef.current = winningPrize
    console.log('🎰 당첨 상품:', winningPrize.name)
    console.log('📍 당첨 칸:', winningPrize.slotIndex + 1)
    setWinner(null)

    // transition 설정 (동적 시간 적용)
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${spinDuration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`
    }

    onSpin()

    // 동적 칸 수에 따른 각도 계산
    const slotAngle = 360 / slotCount
    const slotIndex = winningPrize.slotIndex

    // 역발상: 화면(12시)에 당첨 슬롯이 오도록 회전
    // 슬롯의 실제 SVG 중앙 각도는 slotIndex * slotAngle
    // 12시 방향을 0도로 보면, 슬롯을 12시로 이동시키려면:
    // (360 - 슬롯중앙각도)만큼 회전
    const targetAngle = slotIndex * slotAngle

    console.log('🎯 당첨 슬롯 중앙 각도:', targetAngle.toFixed(1), '도 (칸', slotIndex + 1, ')')

    // 여러 바퀴 회전 (5-8바퀴 랜덤)
    const spins = Math.floor(5 + Math.random() * 4)

    // 현재 회전 상태에서 당첨 슬롯을 12시로 이동
    const currentRotation = rotationRef.current % 360
    // 슬롯을 12시(0도)로 이동: 360 - targetAngle 만큼 회전
    // 현재 각도를 고려하여 정확한 목표 각도 계산
    const targetFinalAngle = (360 - targetAngle) % 360
    const rotationNeeded = (targetFinalAngle - currentRotation + 360) % 360
    const totalRotation = 360 * spins + rotationNeeded

    console.log('🔄 총 회전:', totalRotation.toFixed(1), '도 (기본', spins, '바퀴 +', rotationNeeded.toFixed(1), '도)')

    // 최종 각도 (검증용)
    const expectedFinalRotation = (rotationRef.current + totalRotation) % 360
    console.log('📍 예상 최종 각도:', expectedFinalRotation.toFixed(1), '도 (목표:', targetFinalAngle.toFixed(1), '도)')

    setRotation(prev => {
      const newRotation = prev + totalRotation
      rotationRef.current = newRotation
      console.log('🎡 누적 회전:', newRotation.toFixed(1), '도 (이전:', prev.toFixed(1), '도)')
      return newRotation
    })

    // 애니메이션 완료 후
    spinTimeoutRef.current = setTimeout(() => {
      // 미리 계산한 최종 각도 사용 (클로저)
      const finalRotation = expectedFinalRotation
      console.log('🏁 회전 완료! 최종 각도:', finalRotation.toFixed(1), '도')

      // 12시 방향(0도)에 있어야 할 슬롯 확인
      // finalRotation만큼 회전했으므로, 원래 -finalRotation 위치에 있던 슬롯이 0도에 옴
      const slotAtTop = Math.round((-finalRotation / slotAngle + slotCount) % slotCount)
      console.log('📍 12시 방향 슬롯:', slotAtTop + 1, '(슬롯 인덱스:', slotAtTop, ')')
      console.log('🎯 당첨 슬롯:', winningPrize.slotIndex + 1, '(슬롯 인덱스:', winningPrize.slotIndex, ')')

      if (slotAtTop !== winningPrize.slotIndex) {
        console.error('❌ 불일치! 화면:', slotAtTop + 1, '번 / 당첨:', (winningPrize.slotIndex + 1), '번')
      } else {
        console.log('✅ 일치! 슬롯', (winningPrize.slotIndex + 1), '번이 정확히 12시 방향에 있습니다')
      }

      // 0.5초 후 모달 표시 (사용자가 결과를 볼 수 있도록)
      setTimeout(() => {
        setWinner(winningPrize)
        onSpinEnd(winningPrize)
        currentWinnerRef.current = null
      }, 500)

      spinTimeoutRef.current = null
    }, spinDuration * 1000) // 설정된 시간만큼 회전
  }

  // 모달 닫기
  const handleCloseModal = (e) => {
    e.stopPropagation()
    setWinner(null)
  }

  return (
    <div className="roulette-container">
      <div className="roulette-wheel-wrapper" onClick={handleSpinClick} style={{ cursor: 'pointer' }}>
        {/* 고정 포인터 */}
        <div className="pointer"></div>

        {/* 회전하는 휠 */}
        <div
          ref={wheelRef}
          className={`roulette-wheel ${isSpinning ? 'spinning' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 400 400">
            {getWheelSlots().map((slot) => {
              const slotAngle = 360 / slotCount
              // 칸 1의 중앙이 0도(12시)가 되도록 오프셋
              const startAngle = slot.slotIndex * slotAngle - slotAngle / 2
              const endAngle = startAngle + slotAngle

              // SVG path 계산
              const startRad = (startAngle - 90) * Math.PI / 180
              const endRad = (endAngle - 90) * Math.PI / 180

              const x1 = 200 + 180 * Math.cos(startRad)
              const y1 = 200 + 180 * Math.sin(startRad)
              const x2 = 200 + 180 * Math.cos(endRad)
              const y2 = 200 + 180 * Math.sin(endRad)

              // 호가 180도 이상인지 확인
              const largeArcFlag = slotAngle > 180 ? 1 : 0

              const pathData = [
                `M 200 200`,
                `L ${x1} ${y1}`,
                `A 180 180 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ')

              // 텍스트는 각 등수의 대표 칸(중간 칸)에만 표시
              const allSlots = getWheelSlots()
              const sameRankSlots = allSlots.filter(s => s.rank === slot.rank)
              const middleIndex = Math.floor(sameRankSlots.length / 2)
              const isMiddleSlot = sameRankSlots[middleIndex].slotIndex === slot.slotIndex

              // 칸의 중앙 (오프셋 적용된 각도)
              const midAngle = slot.slotIndex * slotAngle
              const midRad = (midAngle - 90) * Math.PI / 180
              const textX = 200 + 110 * Math.cos(midRad)
              const textY = 200 + 110 * Math.sin(midRad)

              // 텍스트 크기를 칸 수에 따라 조정
              const fontSize = Math.max(8, Math.min(18, 360 / slotCount))

              return (
                <g key={`slot-${slot.slotIndex}`}>
                  <path
                    d={pathData}
                    fill={slot.prize.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {slotCount <= 50 && (
                    <>
                      {/* 칸 번호 - 배경색과 동일하게 (드래그 시에만 보임) */}
                      <text
                        x={textX}
                        y={textY - 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={slot.prize.color}
                        fontSize={Math.max(10, fontSize - 4)}
                        fontWeight="bold"
                        style={{ userSelect: 'text' }}
                      >
                        {slot.slotIndex + 1}
                      </text>

                      {/* 등수 (중간 칸에만) */}
                      {isMiddleSlot && (
                        <text
                          x={textX}
                          y={textY + 5}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#fff"
                          fontSize={fontSize}
                          fontWeight="bold"
                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                        >
                          {slot.rank}등
                        </text>
                      )}
                    </>
                  )}
                </g>
              )
            })}
            {/* 중앙 원 - 흰 배경 */}
            <circle cx="200" cy="200" r="50" fill="#fff" stroke="#FF69B4" strokeWidth="4" />

            {/* 중앙 로고 */}
            <image
              href={`${import.meta.env.BASE_URL}images/logo-symbol.png`}
              x="160"
              y="160"
              width="80"
              height="80"
              style={{ pointerEvents: 'none' }}
            />
          </svg>
        </div>

        {/* 결과 표시 - Portal로 document.body에 직접 렌더링 */}
        {winner && createPortal(
          <div className="result-overlay" onClick={handleCloseModal}>
            <div
              className="result-card"
              style={{ transform: `scale(${(resultModalScale / 100) * 0.7})`, transition: 'transform 0.2s ease' }}
            >
              <h2>🎉 축하합니다! 🎉</h2>

              {/* 당첨 상품 이미지 */}
              <div className="prize-image-container">
                <img
                  src={`${import.meta.env.BASE_URL}images/prizes/prize-${winner.id}.png`}
                  alt={winner.name}
                  className="prize-image"
                  onError={(e) => {
                    console.error('❌ 이미지 로드 실패:', e.target.src)
                    e.target.style.display = 'none'
                  }}
                  onLoad={(e) => {
                    console.log('✅ 이미지 로드 성공:', e.target.src)
                  }}
                />
              </div>

              {/* 상품명 */}
              <div className="winner-name">
                {winner.name}
              </div>

              <button className="close-modal-button" onClick={handleCloseModal}>
                닫기
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* 스핀 버튼 */}
      <button
        className={`spin-button ${isSpinning ? 'spinning' : ''}`}
        onClick={handleSpinClick}
      >
        {isSpinning ? '멈춤' : '룰렛 돌리기'}
      </button>
    </div>
  )
}

export default Roulette
