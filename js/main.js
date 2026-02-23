Vue.component('kanban-card', {
    props: {
        card: {
            type: Object,
            required: true
        },
        columnType: {
            type: String,
            required: true
        }
    },
    template: `
        <div class="card">
            <div class="card-title">{{ card.title }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-deadline">Дедлайн: {{ card.deadline }}</div>
            <div class="card-actions">
                <button v-if="columnType === 'planned'" class="move-forward" @click="$emit('move-forward')"> В работу</button>
                <button class="edit-btn" @click="$emit('edit')">Редактировать</button>
                <button class="delete-btn" @click="$emit('delete')">Удалить</button>
            </div>
        </div>
    `
});

Vue.component('kanban-column', {
    props: {
        title: {
            type: String,
            required: true
        },
        columnType: {
            type: String,
            required: true
        },
        cards: {
            type: Array,
            default: () => []
        }
    },
    template: `
        <div class="kanban-column">
            <div class="column-header">{{ title }}</div>
            <button v-if="columnType === 'planned'" class="add-card-btn" @click="$emit('add-card')">
                + Добавить задачу
            </button>
            <div class="cards-container">
                <kanban-card 
                    v-for="card in cards" 
                    :key="card.id"
                    :card="card"
                    :columnType="columnType"
                    @edit="$emit('edit-card', card)"
                    @delete="$emit('delete-card', card)"
                    @move-forward="$emit('move-forward', card)"
                ></kanban-card>
            </div>
        </div>
    `
});

Vue.component('card-modal', {
    props: {
        isOpen: {
            type: Boolean,
            default: false
        },
        card: {
            type: Object,
            default: () => ({
                title: '',
                description: '',
                deadline: ''
            })
        },
        mode: {
            type: String,
            default: 'create'
        }
    },
    template: `
        <div class="modal" v-if="isOpen" @click.self="$emit('close')">
            <div class="modal-content">
                <h3>{{ mode === 'create' ? 'Создать задачу' : 'Редактировать задачу' }}</h3>
                <input 
                    v-model="localCard.title" 
                    placeholder="Название задачи"
                    type="text"
                >
                <textarea 
                    v-model="localCard.description" 
                    placeholder="Описание задачи"
                ></textarea>
                <input 
                    v-model="localCard.deadline" 
                    placeholder="Дедлайн (ГГГГ-ММ-ДД)"
                    type="text"
                >
                <div class="modal-actions">
                    <button class="save" @click="$emit('save', localCard)">Сохранить</button>
                    <button class="cancel" @click="$emit('close')">Отмена</button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            localCard: {
                title: '',
                description: '',
                deadline: ''
            }
        };
    },
    watch: {
        card: {
            handler(newCard) {
                this.localCard = { ...newCard };
            },
            deep: true,
            immediate: true
        },
        isOpen(newVal) {
            if (newVal && this.mode === 'create') {
                this.localCard = {
                    title: '',
                    description: '',
                    deadline: ''
                };
            }
        }
    }
});


Vue.component('kanban-board', {
    template: `
        <div class="kanban-board">
            <kanban-column 
                title="Запланированные задачи" 
                columnType="planned"
                :cards="plannedCards"
                @add-card="openCreateModal"
                @edit-card="openEditModal"
                @delete-card="deleteCard"
                @move-forward="moveCardForward"
            ></kanban-column>
            
            <kanban-column 
                title="Задачи в работе" 
                columnType="inProgress"
                :cards="inProgressCards"
                @edit-card="openEditModal"
                @delete-card="deleteCard"
            ></kanban-column>
            
            <kanban-column 
                title="Тестирование" 
                columnType="testing"
                :cards="testingCards"
            ></kanban-column>
            
            <kanban-column 
                title="Выполнение задачи" 
                columnType="completed"
                :cards="completedCards"
            ></kanban-column>

            <card-modal
                :isOpen="modalOpen"
                :card="currentCard"
                :mode="modalMode"
                @close="closeModal"
                @save="saveCard"
            ></card-modal>
        </div>
    `,
    data() {
        return {
            plannedCards: [],
            inProgressCards: [],
            testingCards: [],
            completedCards: [],
            modalOpen: false,
            modalMode: 'create',
            currentCard: {
                title: '',
                description: '',
                deadline: ''
            }
        };
    },
    methods: {
        openCreateModal() {
            this.modalMode = 'create';
            this.currentCard = {
                title: '',
                description: '',
                deadline: ''
            };
            this.modalOpen = true;
        },
        openEditModal(card) {
            this.modalMode = 'edit';
            this.currentCard = { ...card };
            this.modalOpen = true;
        },
        closeModal() {
            this.modalOpen = false;
        },
        saveCard(cardData) {
            if (this.modalMode === 'create') {
                const newCard = {
                    ...cardData,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    lastEdited: new Date().toISOString()
                };
                this.plannedCards.push(newCard);
            } else {
                const editedCard = {
                    ...cardData,
                    lastEdited: new Date().toISOString()
                };

                this.updateCardInAllColumns(editedCard);
            }
            this.closeModal();
        },
        deleteCard(card) {
            if (confirm('Удалить задачу?')) {
                this.plannedCards = this.plannedCards.filter(c => c.id !== card.id);
                this.inProgressCards = this.inProgressCards.filter(c => c.id !== card.id);
                this.testingCards = this.testingCards.filter(c => c.id !== card.id);
                this.completedCards = this.completedCards.filter(c => c.id !== card.id);
            }
        },
        updateCardInAllColumns(updatedCard) {
            const updateInArray = (cards) => {
                const index = cards.findIndex(c => c.id === updatedCard.id);
                if (index !== -1) {
                    cards[index] = updatedCard;
                }
                return cards;
            };

            this.plannedCards = updateInArray([...this.plannedCards]);
            this.inProgressCards = updateInArray([...this.inProgressCards]);
            this.testingCards = updateInArray([...this.testingCards]);
            this.completedCards = updateInArray([...this.completedCards]);
        },
        moveCardForward(card) {
            const updatedCard = {
                ...card,
                lastEdited: new Date().toISOString()
            };

            if (this.plannedCards.find(c => c.id === card.id)) {
                this.plannedCards = this.plannedCards.filter(c => c.id !== card.id);
                this.inProgressCards.push(updatedCard);
            }
        }
    }
});

let app = new Vue({
    el: '#app'
});