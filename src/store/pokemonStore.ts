import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ポケモンの型定義
export interface Pokemon {
  id: number;
  damage: number;
  conditions: {
    poisoned: boolean;
    burned: boolean;
    asleep: boolean;
    confused: boolean;
    paralyzed: boolean;
  };
}

// ストアの型定義
interface PokemonStore {
  activePokemon: Pokemon | null;
  benchPokemons: (Pokemon | null)[];
  errorMessage: string | null;
  
  // アクション
  setActivePokemon: (pokemon: Pokemon | null) => void;
  setBenchPokemons: (pokemons: (Pokemon | null)[]) => void;
  showError: (message: string) => void;
  addDamage: (isPokemonActive: boolean, index: number, amount: number) => void;
  reduceDamage: (isPokemonActive: boolean, index: number, amount: number) => void;
  toggleCondition: (isPokemonActive: boolean, index: number, condition: keyof Pokemon['conditions']) => void;
  setupPokemon: (isPokemonActive: boolean, index: number) => void;
  clearPokemon: (isPokemonActive: boolean, index: number, resetPokemon?: Pokemon) => void;
  moveToBattlefield: (benchIndex: number) => void;
  moveToBench: () => void;
  resetAll: () => void;
}

// Zustandストアの作成
export const usePokemonStore = create<PokemonStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      activePokemon: {
        id: 1,
        damage: 0,
        conditions: {
          poisoned: false,
          burned: false,
          asleep: false,
          confused: false,
          paralyzed: false
        }
      },
      benchPokemons: [null, null, null, null, null],
      errorMessage: null,
      
      // アクション
      setActivePokemon: (pokemon) => set({ activePokemon: pokemon }),
      setBenchPokemons: (pokemons) => set({ benchPokemons: pokemons }),
      
      showError: (message) => {
        set({ errorMessage: message });
        setTimeout(() => {
          set({ errorMessage: null });
        }, 3000);
      },
      
      addDamage: (isPokemonActive, index, amount) => {
        if (isPokemonActive) {
          const activePokemon = get().activePokemon;
          if (!activePokemon) return;
          
          set({
            activePokemon: {
              ...activePokemon,
              damage: activePokemon.damage + amount
            }
          });
        } else {
          const benchPokemons = [...get().benchPokemons];
          const pokemon = benchPokemons[index];
          if (!pokemon) return;
          
          benchPokemons[index] = {
            ...pokemon,
            damage: pokemon.damage + amount
          };
          
          set({ benchPokemons });
        }
      },
      
      reduceDamage: (isPokemonActive, index, amount) => {
        if (isPokemonActive) {
          const activePokemon = get().activePokemon;
          if (!activePokemon) return;
          
          set({
            activePokemon: {
              ...activePokemon,
              damage: Math.max(0, activePokemon.damage - amount)
            }
          });
        } else {
          const benchPokemons = [...get().benchPokemons];
          const pokemon = benchPokemons[index];
          if (!pokemon) return;
          
          benchPokemons[index] = {
            ...pokemon,
            damage: Math.max(0, pokemon.damage - amount)
          };
          
          set({ benchPokemons });
        }
      },
      
      toggleCondition: (isPokemonActive, index, condition) => {
        if (isPokemonActive) {
          const activePokemon = get().activePokemon;
          if (!activePokemon) return;
          
          set({
            activePokemon: {
              ...activePokemon,
              conditions: {
                ...activePokemon.conditions,
                [condition]: !activePokemon.conditions[condition]
              }
            }
          });
        } else {
          const benchPokemons = [...get().benchPokemons];
          const pokemon = benchPokemons[index];
          if (!pokemon) return;
          
          benchPokemons[index] = {
            ...pokemon,
            conditions: {
              ...pokemon.conditions,
              [condition]: !pokemon.conditions[condition]
            }
          };
          
          set({ benchPokemons });
        }
      },
      
      setupPokemon: (isPokemonActive, index) => {
        const newPokemon: Pokemon = {
          id: Date.now(),
          damage: 0,
          conditions: {
            poisoned: false,
            burned: false,
            asleep: false,
            confused: false,
            paralyzed: false
          }
        };
        
        if (isPokemonActive) {
          set({ activePokemon: newPokemon });
        } else {
          const benchPokemons = [...get().benchPokemons];
          benchPokemons[index] = newPokemon;
          set({ benchPokemons });
        }
      },
      
      clearPokemon: (isPokemonActive: boolean, index: number, resetPokemon?: Pokemon) => {
        if (isPokemonActive && resetPokemon) {
          // バトル場の場合は状態のみリセット
          set({ activePokemon: resetPokemon });
        } else if (!isPokemonActive) {
          // ベンチの場合は完全に削除
          const benchPokemons = [...get().benchPokemons];
          benchPokemons[index] = null;
          set({ benchPokemons });
        }
      },
      
      moveToBattlefield: (benchIndex) => {
        const { activePokemon, benchPokemons } = get();
        const benchPokemon = benchPokemons[benchIndex];
        
        if (!benchPokemon) return;
        
        const newBenchPokemons = [...benchPokemons];
        newBenchPokemons[benchIndex] = activePokemon;
        
        set({
          activePokemon: benchPokemon,
          benchPokemons: newBenchPokemons
        });
      },
      
      moveToBench: () => {
        const { activePokemon, benchPokemons, showError } = get();
        
        if (!activePokemon) return;
        
        // ベンチにポケモンがいるか確認
        const hasBenchPokemon = benchPokemons.some(p => p !== null);
        
        // ベンチポケモンがいない場合はエラーメッセージを表示
        if (!hasBenchPokemon) {
          showError('ベンチポケモンがいません');
          return;
        }
        
        // 空いているベンチを探す
        const emptyBenchIndex = benchPokemons.findIndex(p => p === null);
        if (emptyBenchIndex === -1) return; // 空きがなければ何もしない
        
        // 一番上の利用可能なベンチポケモンを見つける（ベンチ1から順に）
        const firstBenchPokemonIndex = benchPokemons.findIndex(p => p !== null);
        
        if (firstBenchPokemonIndex === -1) {
          // ベンチにポケモンがいない場合は、バトル場のポケモンをベンチに移動するだけ
          const newBenchPokemons = [...benchPokemons];
          newBenchPokemons[emptyBenchIndex] = activePokemon;
          
          set({
            benchPokemons: newBenchPokemons,
            activePokemon: null // 本来はバトル場を空にしないが、ベンチにポケモンがいない場合の例外処理
          });
        } else {
          // ベンチにポケモンがいる場合は、一番上のベンチポケモンをバトル場に、バトル場のポケモンを空きベンチに
          const newBenchPokemons = [...benchPokemons];
          const benchPokemon = newBenchPokemons[firstBenchPokemonIndex]; // 一番上のベンチポケモン
          
          // バトル場のポケモンを空きベンチに移動
          newBenchPokemons[emptyBenchIndex] = activePokemon;
          
          // 一番上のベンチポケモンをバトル場に移動し、そのベンチを空に
          newBenchPokemons[firstBenchPokemonIndex] = null;
          
          set({
            benchPokemons: newBenchPokemons,
            activePokemon: benchPokemon
          });
        }
      },
      
      resetAll: () => {
        const { activePokemon } = get();
        
        // バトル場のポケモンはリセットせず、ダメージと特殊状態だけリセット
        if (activePokemon) {
          set({
            activePokemon: {
              ...activePokemon,
              damage: 0,
              conditions: {
                poisoned: false,
                burned: false,
                asleep: false,
                confused: false,
                paralyzed: false
              }
            },
            benchPokemons: [null, null, null, null, null]
          });
        } else {
          // バトル場が空の場合は新しいポケモンを配置
          set({
            activePokemon: {
              id: Date.now(),
              damage: 0,
              conditions: {
                poisoned: false,
                burned: false,
                asleep: false,
                confused: false,
                paralyzed: false
              }
            },
            benchPokemons: [null, null, null, null, null]
          });
        }
      }
    }),
    {
      name: 'pokemon-damage-counter-store', // ローカルストレージのキー
    }
  )
);