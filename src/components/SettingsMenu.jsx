import { useState, useEffect } from 'react'
import './SettingsMenu.css'

function SettingsMenu({
  isOpen,
  onClose,
  prizes,
  setPrizes,
  slotCount,
  setSlotCount,
  slotConfig,
  setSlotConfig,
  spinDuration,
  setSpinDuration,
  useCustomProbability,
  setUseCustomProbability,
  customProbabilities,
  setCustomProbabilities
}) {
  const [tempPrizes, setTempPrizes] = useState(prizes)
  const [tempSlotCount, setTempSlotCount] = useState(slotCount)
  const [tempSlotConfig, setTempSlotConfig] = useState(slotConfig)
  const [tempSpinDuration, setTempSpinDuration] = useState(spinDuration)
  const [tempUseCustomProb, setTempUseCustomProb] = useState(useCustomProbability)
  const [tempCustomProb, setTempCustomProb] = useState(customProbabilities)

  useEffect(() => {
    setTempPrizes(prizes)
    setTempSlotCount(slotCount)
    setTempSlotConfig(slotConfig)
    setTempSpinDuration(spinDuration)
    setTempUseCustomProb(useCustomProbability)
    setTempCustomProb(customProbabilities)
  }, [prizes, slotCount, slotConfig, spinDuration, useCustomProbability, customProbabilities])

  // 총 칸 수 변경
  const handleSlotCountChange = (newCount) => {
    const count = Math.max(1, Math.min(360, Number(newCount)))
    setTempSlotCount(count)

    // slotConfig 크기 조정
    const newConfig = [...tempSlotConfig]
    if (count > newConfig.length) {
      // 칸이 늘어나면 마지막 등수로 채움
      const lastRank = newConfig[newConfig.length - 1] || 1
      while (newConfig.length < count) {
        newConfig.push(lastRank)
      }
    } else {
      // 칸이 줄어들면 자름
      newConfig.length = count
    }
    setTempSlotConfig(newConfig)
  }

  // 특정 칸의 등수 변경
  const handleSlotRankChange = (slotIndex, rank) => {
    const newConfig = [...tempSlotConfig]
    newConfig[slotIndex] = Number(rank)
    setTempSlotConfig(newConfig)
  }

  // 상품명 변경
  const handleNameChange = (id, newName) => {
    setTempPrizes(prev =>
      prev.map(prize =>
        prize.id === id ? { ...prize, name: newName } : prize
      )
    )
  }

  // 색상 변경
  const handleColorChange = (id, newColor) => {
    setTempPrizes(prev =>
      prev.map(prize =>
        prize.id === id ? { ...prize, color: newColor } : prize
      )
    )
  }

  // 상품(등수) 추가
  const addPrize = () => {
    const newId = Math.max(...tempPrizes.map(p => p.id)) + 1
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    setTempPrizes([
      ...tempPrizes,
      { id: newId, name: `${newId}등`, color: randomColor }
    ])
  }

  // 상품(등수) 삭제
  const removePrize = (id) => {
    if (tempPrizes.length <= 1) {
      alert('최소 1개의 상품이 필요합니다.')
      return
    }

    // 삭제하려는 등수가 slotConfig에 사용 중인지 확인
    const isUsed = tempSlotConfig.some(rank => rank === id)
    if (isUsed) {
      alert(`${id}등은 현재 룰렛 칸에 사용 중입니다. 먼저 칸 설정을 변경해주세요.`)
      return
    }

    setTempPrizes(prev => prev.filter(prize => prize.id !== id))
  }

  // 커스텀 확률 값 변경
  const handleCustomProbChange = (prizeId, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0))
    setTempCustomProb(prev => ({
      ...prev,
      [prizeId]: numValue
    }))
  }

  // 슬롯 배치 기반 확률 계산
  const getSlotBasedProbabilities = () => {
    const slotProb = {}
    const totalSlots = tempSlotConfig.length

    // 각 등수의 슬롯 개수 세기
    tempPrizes.forEach(prize => {
      const slotsCount = tempSlotConfig.filter(rank => rank === prize.id).length
      slotProb[prize.id] = Number(((slotsCount / totalSlots) * 100).toFixed(1))
    })

    return slotProb
  }

  // 저장
  const handleSave = () => {
    // 모든 칸이 유효한 등수인지 확인
    const prizeIds = tempPrizes.map(p => p.id)
    const invalidSlots = tempSlotConfig.filter(rank => !prizeIds.includes(rank))

    if (invalidSlots.length > 0) {
      alert('일부 칸에 존재하지 않는 등수가 설정되어 있습니다. 모든 칸을 확인해주세요.')
      return
    }

    // 커스텀 확률 검증
    if (tempUseCustomProb) {
      const total = Object.values(tempCustomProb).reduce((sum, val) => sum + (Number(val) || 0), 0)
      if (Math.abs(total - 100) > 0.1) {
        alert(`확률의 합계가 100%가 되어야 합니다. 현재: ${total.toFixed(1)}%`)
        return
      }
    }

    setPrizes(tempPrizes)
    setSlotCount(tempSlotCount)
    setSlotConfig(tempSlotConfig)
    setSpinDuration(tempSpinDuration)
    setUseCustomProbability(tempUseCustomProb)
    setCustomProbabilities(tempCustomProb)
    onClose()
  }

  // 초기화
  const handleReset = () => {
    if (window.confirm('설정을 초기화하시겠습니까?')) {
      const defaultPrizes = [
        { id: 1, name: '치약,칫솔,구강스프레이(2+1)세트', color: '#FF69B4' },
        { id: 2, name: '구강스프레이 단품', color: '#7FFFD4' },
        { id: 3, name: '마우스워시 단품', color: '#FFB6C1' }
      ]
      setTempPrizes(defaultPrizes)
      setTempSlotCount(10)
      setTempSlotConfig([1, 2, 2, 2, 2, 3, 3, 3, 3, 3])
    }
  }

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>룰렛 설정</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* 총 칸 수 설정 */}
          <div className="slot-count-section">
            <label>총 칸 수 (1-360)</label>
            <input
              type="number"
              value={tempSlotCount}
              onChange={(e) => handleSlotCountChange(e.target.value)}
              min="1"
              max="360"
              className="slot-count-input"
            />
          </div>

          {/* 상품(등수) 관리 */}
          <div className="prizes-section">
            <h3>상품 관리</h3>
            <div className="prizes-list">
              {tempPrizes.map((prize) => (
                <div key={prize.id} className="prize-item">
                  <div className="prize-header">
                    <span className="prize-rank">{prize.id}등</span>
                    <input
                      type="text"
                      value={prize.name}
                      onChange={(e) => handleNameChange(prize.id, e.target.value)}
                      className="prize-name-input"
                      placeholder="상품명"
                    />
                    <input
                      type="color"
                      value={prize.color}
                      onChange={(e) => handleColorChange(prize.id, e.target.value)}
                      className="color-input"
                    />
                    <button
                      className="remove-button"
                      onClick={() => removePrize(prize.id)}
                      disabled={tempPrizes.length <= 1}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="add-prize-button" onClick={addPrize}>
              + 상품 추가
            </button>
          </div>

          {/* 칸별 등수 설정 */}
          <div className="slot-config-section">
            <h3>칸별 등수 설정</h3>
            <div className="slot-config-grid">
              {tempSlotConfig.map((rank, index) => (
                <div key={index} className="slot-config-item">
                  <label>칸 {index + 1}</label>
                  <select
                    value={rank}
                    onChange={(e) => handleSlotRankChange(index, e.target.value)}
                    className="slot-rank-select"
                  >
                    {tempPrizes.map(prize => (
                      <option key={prize.id} value={prize.id}>
                        {prize.id}등
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 룰렛 회전 시간 설정 */}
          <div className="spin-duration-section">
            <label>룰렛 회전 시간 (초)</label>
            <input
              type="number"
              value={tempSpinDuration}
              onChange={(e) => {
                const value = Math.max(1, Math.min(999, Number(e.target.value) || 1))
                setTempSpinDuration(value)
              }}
              min="1"
              max="999"
              className="spin-duration-input"
            />
          </div>

          {/* 커스텀 확률 설정 */}
          <div className="custom-probability-section">
            <div className="section-header-with-checkbox">
              <h3>커스텀 확률 사용</h3>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={tempUseCustomProb}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setTempUseCustomProb(checked)
                    if (checked && Object.keys(tempCustomProb).length === 0) {
                      // 처음 활성화 시 슬롯 배치 기반 확률로 초기화
                      setTempCustomProb(getSlotBasedProbabilities())
                    }
                  }}
                />
                <span className="checkbox-label">활성화</span>
              </label>
            </div>

            {tempUseCustomProb && (
              <div className="probability-list">
                {tempPrizes.map(prize => {
                  const probValue = tempCustomProb[prize.id] || 0
                  return (
                    <div key={prize.id} className="probability-item">
                      <span className="prob-rank">{prize.id}등</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={probValue}
                        onChange={(e) => handleCustomProbChange(prize.id, e.target.value)}
                        className="prob-input"
                      />
                      <span className="prob-unit">%</span>
                    </div>
                  )
                })}
                <div className="prob-total">
                  합계: {Object.values(tempCustomProb).reduce((sum, val) => sum + (Number(val) || 0), 0).toFixed(1)}%
                </div>
                <button
                  className="reset-prob-button"
                  onClick={() => setTempCustomProb(getSlotBasedProbabilities())}
                >
                  현재 배치로 조정
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer">
          <button className="reset-button" onClick={handleReset}>
            초기화
          </button>
          <button className="save-button" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsMenu
