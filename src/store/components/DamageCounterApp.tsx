import React, { useState } from 'react';
import { usePokemonStore } from '../pokemonStore';
import type { Pokemon } from '../pokemonStore';

// 確認モーダルの型定義
interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// 確認モーダルコンポーネント
const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center" style={{ position: 'fixed' }}>
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full m-4">
        <p className="mb-6 text-center text-lg text-black">{message}</p>
        <div className="flex justify-center space-x-6">
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg text-base"
          >
            はい
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg text-base"
          >
            いいえ
          </button>
        </div>
      </div>
    </div>
  );
};

// メインアプリコンポーネント
const DamageCounterApp: React.FC = () => {
  // Zustandストアからステートとアクションを取得
  const {
    activePokemon,
    benchPokemons,
    errorMessage,
    addDamage,
    reduceDamage,
    toggleCondition,
    setupPokemon,
    clearPokemon,
    moveToBattlefield,
    moveToBench,
    resetAll
  } = usePokemonStore();
  
  // 確認モーダルの状態
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: 'すべてリセットしてもよろしいですか？',
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  // 確認モーダルを表示する関数
  const showConfirmModal = () => {
    setConfirmModal({
      isOpen: true,
      message: 'すべてリセットしてもよろしいですか？',
      onConfirm: () => {
        resetAll();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // 特殊状態のデータ
  const conditions: Record<keyof Pokemon['conditions'], { icon: string; label: string }> = {
    'poisoned': { icon: '☠️', label: 'どく' },
    'burned': { icon: '🔥', label: 'やけど' },
    'asleep': { icon: '💤', label: 'ねむり' },
    'confused': { icon: '❓', label: 'こんらん' },
    'paralyzed': { icon: '⚡', label: 'まひ' }
  };
  
  // ポケモンカードコンポーネント
  const PokemonCard = ({ pokemon, isPokemonActive, index }: { 
    pokemon: Pokemon | null, 
    isPokemonActive: boolean,
    index: number 
  }) => {
    if (!pokemon) {
      return (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 flex flex-col items-center justify-center min-h-[180px] md:min-h-[220px] border border-gray-400">
          <span className="text-gray-500 mb-4 text-base md:text-lg">{isPokemonActive ? 'バトル場' : `ベンチ${index + 1}`}</span>
          <button
            onClick={() => setupPokemon(isPokemonActive, index)}
            className="bg-black hover:bg-gray-800 text-white px-4 md:px-5 py-2 md:py-3 rounded-lg text-sm md:text-base shadow-sm"
          >
            ポケモンを設定
          </button>
        </div>
      );
    }
    
    // バトル場とベンチでスタイルを分ける
    const cardStyle = isPokemonActive
      ? "bg-white rounded-xl shadow-lg p-4 md:p-6 min-h-[180px] md:min-h-[220px] relative border-2 border-red-700"
      : "bg-white rounded-xl shadow-lg p-4 md:p-6 min-h-[180px] md:min-h-[220px] relative border border-gray-400";
    
    // 操作ボタン
    const handleClear = () => {
      if (isPokemonActive) {
        // バトル場の場合は、ダメージと特殊状態のみリセット
        if (pokemon) {
          const resetPokemon: Pokemon = {
            ...pokemon,
            damage: 0,
            conditions: {
              poisoned: false,
              burned: false,
              asleep: false,
              confused: false,
              paralyzed: false
            }
          };
          clearPokemon(isPokemonActive, index, resetPokemon);
        }
      } else {
        // ベンチの場合は完全に削除
        clearPokemon(isPokemonActive, index);
      }
    };

    return (
      <div className={cardStyle}>
        {/* 場所タイトル */}
        <div className={`text-center font-bold mb-4 ${isPokemonActive ? 'text-red-700' : 'text-blue-700'} text-lg`}>
          {isPokemonActive ? 'バトル場' : `ベンチ${index + 1}`}
        </div>
        
        {/* ダメージカウンター */}
        <div className="flex justify-center items-center mb-4 md:mb-6">
          <div className="text-3xl md:text-4xl font-bold rounded-full bg-white text-black w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border-2 border-black shadow-md">
            {pokemon.damage}
          </div>
        </div>
        
        {/* ダメージコントロール */}
        <div className="mb-3 md:mb-4">
          <div className="grid grid-cols-3 gap-2 md:gap-3 mb-2 md:mb-3">
            <button 
              onClick={() => reduceDamage(isPokemonActive, index, 10)}
              className="bg-green-100 hover:bg-green-200 text-green-800 py-3 rounded-lg text-base font-medium border border-green-400 w-full flex items-center justify-center"
            >
              -10
            </button>
            <button 
              onClick={() => addDamage(isPokemonActive, index, 10)}
              className="bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg text-base font-medium border border-red-400 w-full flex items-center justify-center"
            >
              +10
            </button>
            <button 
              onClick={() => addDamage(isPokemonActive, index, 20)}
              className="bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg text-base font-medium border border-red-400 w-full flex items-center justify-center"
            >
              +20
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <button 
              onClick={() => addDamage(isPokemonActive, index, 30)}
              className="bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg text-base font-medium border border-red-400 w-full flex items-center justify-center"
            >
              +30
            </button>
            <button 
              onClick={() => addDamage(isPokemonActive, index, 50)}
              className="bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg text-base font-medium border border-red-400 w-full flex items-center justify-center"
            >
              +50
            </button>
            <button 
              onClick={() => addDamage(isPokemonActive, index, 100)}
              className="bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg text-base font-medium border border-red-400 w-full flex items-center justify-center"
            >
              +100
            </button>
          </div>
        </div>
        
        {/* 特殊状態（バトル場のポケモンのみ） */}
        {isPokemonActive && (
          <div className="mb-5">
            <div className="text-sm font-bold mb-3">特殊状態</div>
            <div className="flex justify-between gap-1">
              {(Object.keys(conditions) as Array<keyof Pokemon['conditions']>).map((condition) => {
                // 特殊状態別のスタイル
                const getConditionStyle = () => {
                  if (!pokemon.conditions[condition]) {
                    return 'bg-gray-100 text-gray-800 border border-gray-300';
                  }
                  
                  // アクティブ時のスタイル（特殊状態別）
                  switch(condition) {
                    case 'poisoned':
                      return 'bg-purple-200 text-purple-800 border border-purple-400';
                    case 'burned':
                      return 'bg-red-200 text-red-800 border border-red-400';
                    case 'asleep':
                      return 'bg-blue-200 text-blue-800 border border-blue-400';
                    case 'confused':
                      return 'bg-pink-200 text-pink-800 border border-pink-400';
                    case 'paralyzed':
                      return 'bg-yellow-100 text-yellow-700 border border-yellow-400';
                    default:
                      return 'bg-gray-200 text-gray-800 border border-gray-400';
                  }
                };
                
                return (
                  <button 
                    key={condition}
                    onClick={() => toggleCondition(isPokemonActive, index, condition)}
                    className={`px-1 py-2 rounded-lg text-xs flex items-center flex-1 justify-center ${getConditionStyle()}`}
                  >
                    <span className="mr-1">{conditions[condition].icon}</span>
                    <span>{conditions[condition].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 操作ボタン */}
        <div className="flex justify-between gap-2 mt-4">
          {isPokemonActive ? (
            <>
              <button
                onClick={moveToBench}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-4 py-2 rounded-lg text-sm border border-blue-700 flex-1 min-w-0"
              >
                ベンチへ
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm border border-gray-700 px-2 sm:px-4 py-2 rounded-lg flex-1 min-w-0"
              >
                クリア
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => moveToBattlefield(index)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-4 py-2 rounded-lg text-sm border border-red-700 flex-1 min-w-0"
              >
                バトル場へ
              </button>
              <button
                onClick={handleClear}
                className="bg-gray-600 hover:bg-gray-700 text-white text-sm border border-gray-700 px-2 sm:px-4 py-2 rounded-lg flex-1 min-w-0"
              >
                削除
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full min-h-screen bg-gray-100 p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-[2000px] mx-auto">
        <div className="space-y-6">
          {/* バトル場 */}
          <div className="w-full max-w-2xl mx-auto">
            <PokemonCard 
              pokemon={activePokemon} 
              isPokemonActive={true}
              index={0}
            />
          </div>
          
          {/* ベンチ */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              {benchPokemons.map((pokemon, index) => (
                <PokemonCard 
                  key={index}
                  pokemon={pokemon}
                  isPokemonActive={false}
                  index={index}
                />
              ))}
            </div>
          </div>
          
          {/* リセットボタン */}
          <div className="w-full max-w-2xl mx-auto">
            <button
              onClick={showConfirmModal}
              className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-lg text-base border border-gray-600 shadow-md"
            >
              リセット
            </button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-center max-w-md mx-4">
              {errorMessage}
            </div>
          </div>
        )}
        
        {/* 確認モーダル */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      </div>
    </div>
  );
};

export default DamageCounterApp;