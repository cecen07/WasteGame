import React, { useState, useEffect, useRef } from 'react';

const WASTE_ITEMS = [
  { name: 'Plastik Şişe', recyclable: true, emoji: '🍾', color: '#3498db' },
  { name: 'Cam Şişe', recyclable: true, emoji: '🍷', color: '#27ae60' },
  { name: 'Pil', recyclable: false, emoji: '🔋', color: '#e74c3c' },
  { name: 'Kağıt', recyclable: true, emoji: '📄', color: '#f39c12' },
  { name: 'Yiyecek Atığı', recyclable: false, emoji: '🍎', color: '#8b4513' },
  { name: 'Metal Kutu', recyclable: true, emoji: '🥫', color: '#95a5a6' },
  { name: 'Kırık Oyuncak', recyclable: false, emoji: '🧸', color: '#e91e63' },
  { name: 'Gazete', recyclable: true, emoji: '📰', color: '#f1c40f' },
  { name: 'Plastik Poşet', recyclable: false, emoji: '🛍️', color: '#9b59b6' },
  { name: 'Karton Kutu', recyclable: true, emoji: '📦', color: '#d68910' },
  { name: 'Cam Kavanoz', recyclable: true, emoji: '🫙', color: '#16a085' },
  { name: 'Plastik Bardak', recyclable: true, emoji: '🥤', color: '#3498db' },
  { name: 'Meyve Kabuğu', recyclable: false, emoji: '🍌', color: '#f39c12' },
  { name: 'Alüminyum Folyo', recyclable: true, emoji: '📋', color: '#bdc3c7' },
];

const TOTAL_ITEMS = 20;
const FALL_DURATION = 4000;

export default function WasteRecyclingGame() {
  const [score, setScore] = useState(0);
  const [itemsProcessed, setItemsProcessed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemPosition, setItemPosition] = useState({ top: 0, left: 50 });
  const [isItemFalling, setIsItemFalling] = useState(false);
  const [itemGoingToBin, setItemGoingToBin] = useState(null);
  
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Puana göre tuğla duvar arkaplanı
  const getBackgroundStyle = () => {
    const maxScore = TOTAL_ITEMS * 10;
    const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
    
    // Tuğla rengi: Koyu kahverengi -> Açık mavi
    let brickColor1, brickColor2, mortarColor;
    
    if (percentage < 30) {
      // Çok kötü - koyu, kirli tuğla
      brickColor1 = '#8B4513';
      brickColor2 = '#6B3410';
      mortarColor = '#4a4a4a';
    } else if (percentage < 60) {
      // Orta - kahverengi-gri karışımı
      brickColor1 = '#A0826D';
      brickColor2 = '#8B7355';
      mortarColor = '#696969';
    } else if (percentage < 85) {
      // İyi - açık tuğla
      brickColor1 = '#B8A18E';
      brickColor2 = '#C4B5A0';
      mortarColor = '#8B8B8B';
    } else {
      // Mükemmel - mavi tonlara geçiş
      brickColor1 = '#7FB3D5';
      brickColor2 = '#5DADE2';
      mortarColor = '#AED6F1';
    }
    
    // Çatlak yoğunluğu (düşük puan = çok çatlak)
    const crackOpacity = Math.max(0, 0.7 - (percentage * 0.007));
    const dirtOpacity = Math.max(0, 0.5 - (percentage * 0.005));
    
    return {
      backgroundColor: mortarColor,
      backgroundImage: `
        linear-gradient(335deg, ${brickColor1} 23px, transparent 23px),
        linear-gradient(155deg, ${brickColor1} 23px, transparent 23px),
        linear-gradient(335deg, ${brickColor2} 23px, transparent 23px),
        linear-gradient(155deg, ${brickColor2} 23px, transparent 23px),
        repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,${crackOpacity}) 3px, rgba(0,0,0,${crackOpacity}) 4px),
        repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,${crackOpacity}) 3px, rgba(0,0,0,${crackOpacity}) 4px),
        repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(0,0,0,${crackOpacity * 0.5}) 20px, rgba(0,0,0,${crackOpacity * 0.5}) 22px),
        repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(0,0,0,${crackOpacity * 0.5}) 20px, rgba(0,0,0,${crackOpacity * 0.5}) 22px),
        radial-gradient(circle at 20% 30%, rgba(0,0,0,${dirtOpacity}) 1px, transparent 2px),
        radial-gradient(circle at 60% 70%, rgba(0,0,0,${dirtOpacity}) 1px, transparent 2px),
        radial-gradient(circle at 80% 20%, rgba(0,0,0,${dirtOpacity * 0.7}) 1px, transparent 2px),
        linear-gradient(90deg, rgba(255,255,255,${0.1 - crackOpacity * 0.1}) 1px, transparent 1px)
      `,
      backgroundSize: `
        58px 58px,
        58px 58px,
        58px 58px,
        58px 58px,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100%,
        100% 100%,
        58px 58px
      `,
      backgroundPosition: `
        0px 2px,
        4px 35px,
        29px 31px,
        34px 6px,
        0 0,
        0 0,
        0 0,
        0 0,
        0 0,
        0 0,
        0 0,
        0 0
      `,
      transition: 'all 1.5s ease-in-out'
    };
  };

  // Yeni atık oluştur
  const spawnNewItem = () => {
    if (itemsProcessed >= TOTAL_ITEMS) return;
    
    const randomItem = WASTE_ITEMS[Math.floor(Math.random() * WASTE_ITEMS.length)];
    const randomLeft = 30 + Math.random() * 40;
    
    setCurrentItem(randomItem);
    setItemPosition({ top: 0, left: randomLeft });
    setIsItemFalling(true);
    
    let position = 0;
    const step = 100 / (FALL_DURATION / 50);
    
    intervalRef.current = setInterval(() => {
      position += step;
      setItemPosition(prev => ({ ...prev, top: position }));
      
      if (position >= 100) {
        clearInterval(intervalRef.current);
        setIsItemFalling(false);
        setCurrentItem(null);
        
        if (itemsProcessed < TOTAL_ITEMS - 1) {
          timeoutRef.current = setTimeout(spawnNewItem, 1000);
        }
      }
    }, 50);
  };

  // Oyun başlat
  const startGame = () => {
    setGameStarted(true);
    timeoutRef.current = setTimeout(spawnNewItem, 500);
  };

  // Klavye kontrolü
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isItemFalling || !currentItem || gameOver || !gameStarted) return;
      
      let isCorrect = false;
      let targetBin = null;
      
      if (e.key === 'ArrowLeft' && currentItem.recyclable) {
        isCorrect = true;
        targetBin = 'left';
      } else if (e.key === 'ArrowRight' && !currentItem.recyclable) {
        isCorrect = true;
        targetBin = 'right';
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        isCorrect = false;
        targetBin = e.key === 'ArrowLeft' ? 'left' : 'right';
      } else {
        return;
      }
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setItemGoingToBin(targetBin);
      
      setTimeout(() => {
        if (isCorrect) {
          setScore(prev => prev + 10);
          setFeedback({ type: 'success', message: '✓ Doğru!' });
        } else {
          setScore(prev => Math.max(0, prev - 5));
          setFeedback({ type: 'error', message: '✗ Yanlış!' });
        }
        
        setIsItemFalling(false);
        setCurrentItem(null);
        setItemGoingToBin(null);
        
        setTimeout(() => {
          setFeedback(null);
        }, 800);
        
        setItemsProcessed(prev => {
          const newCount = prev + 1;
          if (newCount >= TOTAL_ITEMS) {
            setTimeout(() => setGameOver(true), 1000);
          } else {
            timeoutRef.current = setTimeout(spawnNewItem, 1200);
          }
          return newCount;
        });
      }, 600);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isItemFalling, currentItem, gameOver, gameStarted]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetGame = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    setScore(0);
    setItemsProcessed(0);
    setGameOver(false);
    setGameStarted(false);
    setFeedback(null);
    setCurrentItem(null);
    setItemPosition({ top: 0, left: 50 });
    setIsItemFalling(false);
    setItemGoingToBin(null);
  };

  const getEncouragementMessage = () => {
    const percentage = (score / (TOTAL_ITEMS * 10)) * 100;
    
    if (percentage >= 90) {
      return { emoji: '🌟', text: 'Çevre Dostu Kahraman!', color: '#FFD700' };
    } else if (percentage >= 70) {
      return { emoji: '🎉', text: 'Harika İş Çıkardın!', color: '#4CAF50' };
    } else if (percentage >= 50) {
      return { emoji: '👍', text: 'İyi Gidiyorsun!', color: '#2196F3' };
    } else {
      return { emoji: '💪', text: 'Biraz Daha Dikkat!', color: '#FF9800' };
    }
  };

  const getItemStyle = () => {
    if (itemGoingToBin) {
      const targetLeft = itemGoingToBin === 'left' ? 20 : 80;
      return {
        top: '85%',
        left: `${targetLeft}%`,
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: 'translate(-50%, -50%) scale(0.5)',
        opacity: 0.7
      };
    }
    
    return {
      top: `${itemPosition.top}%`,
      left: `${itemPosition.left}%`,
      transition: 'none',
      transform: 'translate(-50%, -50%)',
      opacity: 1
    };
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      ...getBackgroundStyle()
    }}>
      {/* Başlangıç Modal */}
      {!gameStarted && !gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px 50px',
            borderRadius: 25,
            textAlign: 'center',
            maxWidth: 600,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: 70, marginBottom: 20 }}>♻️</div>
            <div style={{ fontSize: 36, fontWeight: 'bold', color: '#2c3e50', marginBottom: 25 }}>
              Atık Ayrıştırma Oyunu
            </div>
            <div style={{
              backgroundColor: '#E8F5E9',
              padding: 25,
              borderRadius: 15,
              marginBottom: 25,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 20 }}>
                🎮 Nasıl Oynanır?
              </div>
              <div style={{ fontSize: 18, color: '#34495e', marginBottom: 12, textAlign: 'left' }}>
                <strong>← Sol Ok Tuşu:</strong> Geri Dönüştürülebilir
              </div>
              <div style={{ fontSize: 18, color: '#34495e', marginBottom: 12, textAlign: 'left' }}>
                <strong>→ Sağ Ok Tuşu:</strong> Geri Dönüştürülemez
              </div>
              <div style={{ fontSize: 16, color: '#7f8c8d', fontStyle: 'italic', marginTop: 15 }}>
                Atık düşerken doğru tuşa bas!
              </div>
            </div>
            <button
              onClick={startGame}
              style={{
                fontSize: 24,
                padding: '18px 50px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: 15,
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(39, 174, 96, 0.5)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#229954';
                e.target.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#27ae60';
                e.target.style.transform = 'scale(1)';
              }}
            >
              🚀 Oyunu Başlat
            </button>
          </div>
        </div>
      )}

      {/* Puan ve İlerleme */}
      {gameStarted && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '15px 40px',
            borderRadius: 15,
            boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 }}>
              🎯 Puan: {score}
            </div>
            <div style={{ fontSize: 18, color: '#7f8c8d' }}>
              {itemsProcessed} / {TOTAL_ITEMS} atık
            </div>
          </div>
        </div>
      )}

      {/* Düşen Atık */}
      {currentItem && isItemFalling && (
        <div style={{
          position: 'absolute',
          zIndex: 5,
          ...getItemStyle()
        }}>
          <div style={{
            fontSize: 100,
            animation: 'rotate 2s linear infinite',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
          }}>
            {currentItem.emoji}
          </div>
          <div style={{
            textAlign: 'center',
            marginTop: 10,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#2c3e50',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '8px 20px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            {currentItem.name}
          </div>
        </div>
      )}

      {/* Geri Bildirim */}
      {feedback && (
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          fontSize: 90,
          fontWeight: 'bold',
          color: feedback.type === 'success' ? '#27ae60' : '#e74c3c',
          textShadow: '5px 5px 10px rgba(0,0,0,0.5)',
          animation: 'pulse 0.5s ease-in-out',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '25px 50px',
          borderRadius: 25,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
        }}>
          {feedback.message}
        </div>
      )}

      {/* Kovalar */}
      {gameStarted && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          padding: '0 50px 30px'
        }}>
          {/* Geri Dönüştürülebilir Kova */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#27ae60',
              marginBottom: 15,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '10px 20px',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              ← GERİ DÖNÜŞTÜRÜLEBİLİR
            </div>
            <div style={{
              width: 200,
              height: 250,
              backgroundColor: '#27ae60',
              borderRadius: '20px 20px 40px 40px',
              border: '6px solid #1e8449',
              boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 70,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)'
              }}></div>
              ♻️
            </div>
          </div>

          {/* Geri Dönüştürülemez Kova */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#95a5a6',
              marginBottom: 15,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '10px 20px',
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              GERİ DÖNÜŞTÜRÜLEMEZ →
            </div>
            <div style={{
              width: 200,
              height: 250,
              backgroundColor: '#95a5a6',
              borderRadius: '20px 20px 40px 40px',
              border: '6px solid #7f8c8d',
              boxShadow: '0 12px 35px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 70,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '30%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)'
              }}></div>
              🗑️
            </div>
          </div>
        </div>
      )}

      {/* Oyun Sonu Ekranı */}
      {gameOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.5s ease-in'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: 50,
            borderRadius: 25,
            textAlign: 'center',
            maxWidth: 550,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: 100, marginBottom: 20 }}>
              {getEncouragementMessage().emoji}
            </div>
            <div style={{
              fontSize: 40,
              fontWeight: 'bold',
              color: getEncouragementMessage().color,
              marginBottom: 25
            }}>
              {getEncouragementMessage().text}
            </div>
            <div style={{ fontSize: 28, marginBottom: 10, color: '#2c3e50' }}>
              Toplam Puan
            </div>
            <div style={{ fontSize: 64, fontWeight: 'bold', color: '#e74c3c', marginBottom: 25 }}>
              {score}
            </div>
            <div style={{ fontSize: 20, color: '#7f8c8d', marginBottom: 35 }}>
              {TOTAL_ITEMS} atıktan <strong>{Math.round((score / (TOTAL_ITEMS * 10)) * TOTAL_ITEMS)}</strong> tanesini doğru ayırdın!
            </div>
            <button
              onClick={resetGame}
              style={{
                fontSize: 22,
                padding: '18px 45px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(52, 152, 219, 0.5)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2980b9';
                e.target.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#3498db';
                e.target.style.transform = 'scale(1)';
              }}
            >
              🔄 Tekrar Oyna
            </button>
          </div>
        </div>
      )}

      {/* CSS Animasyonlar */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
