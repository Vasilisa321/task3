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
        <div class="card" :class="{ overdue: card.status === 'overdue', completed: card.status === 'completed' }">
            <div class="card-header">
                Создано: {{ formatDate(card.createdAt) }}
            </div>
            <div class="card-header">
                Изменено: {{ formatDate(card.lastEdited) }}
            </div>
            <div class="card-title">{{ card.title }}</div>
            <div class="card-description">{{ card.description }}</div>
            <div class="card-deadline">Дедлайн: {{ formatDeadline(card.deadline) }}</div>
            <div v-if="columnType === 'completed'" class="card-status">
                Статус: {{ card.status === 'overdue' ? 'Просрочено' : 'Выполнено в срок' }}
            </div>
            <div class="card-actions">
                <button v-if="columnType === 'planned'" class="move-forward" @click="$emit('move-forward')">В работу</button>
                <button v-if="columnType === 'inProgress'" class="move-forward" @click="$emit('move-forward')">В тестирование</button>
                <button v-if="columnType === 'testing'" class="move-forward" @click="$emit('move-forward')">Выполнено</button>
                <button v-if="columnType === 'testing'" class="move-back" @click="showReturnReason = true">Вернуть в работу</button>
                <button class="edit-btn" @click="$emit('edit')">Редактировать</button>
                <button class="delete-btn" @click="$emit('delete')">Удалить</button>
            </div>
            
            <div v-if="showReturnReason" class="modal" @click.self="showReturnReason = false">
                <div class="modal-content">
                    <h4>Причина возврата</h4>
                    <input v-model="returnReason" placeholder="Укажите причину возврата">
                    <div class="modal-actions">
                        <button class="save" @click="submitReturn">Отправить</button>
                        <button class="cancel" @click="showReturnReason = false">Отмена</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            showReturnReason: false,
            returnReason: ''
        };
    },
    methods: {
        formatDate(date) {
            if (!date) return 'Нет данных';
            return new Date(date).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        formatDeadline(deadline) {
            if (!deadline) return 'Не указан';
            return new Date(deadline).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        },
        submitReturn() {
            this.$emit('move-back', this.returnReason);
            this.showReturnReason = false;
            this.returnReason = '';
        }
    }
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
                    @move-back="$emit('move-back', card, $event)"
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
                
                <div class="date-input-group">
                    <label>Дедлайн:</label>
                    <input 
                        type="date"
                        v-model="deadlineDate"
                        :min="today"
                    >
                </div>
                
                <div class="modal-actions">
                    <button class="save" @click="saveCard">Сохранить</button>
                    <button class="cancel" @click="$emit('close')">Отмена</button>
                </div>
            </div>
        </div>
    `,
    data() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        return {
            localCard: {
                title: '',
                description: '',
                deadline: ''
            },
            deadlineDate: '',
            today: `${year}-${month}-${day}`
        };
    },
    watch: {
        card: {
            handler(newCard) {
                this.localCard = {
                    title: newCard.title || '',
                    description: newCard.description || '',
                    deadline: newCard.deadline || ''
                };

                if (newCard.deadline) {
                    const date = new Date(newCard.deadline);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        this.deadlineDate = `${year}-${month}-${day}`;
                    } else {
                        this.deadlineDate = '';
                    }
                } else {
                    this.deadlineDate = '';
                }
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
                this.deadlineDate = '';
            }
        }
    },
    methods: {
        saveCard() {
            if (!this.localCard.title.trim()) {
                alert('Введите название задачи');
                return;
            }

            const cardToSave = {
                title: this.localCard.title,
                description: this.localCard.description || '',
                deadline: this.deadlineDate || ''
            };

            this.$emit('save', cardToSave);
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
                @move-forward="moveCardForward"
            ></kanban-column>
            
            <kanban-column 
                title="Тестирование" 
                columnType="testing"
                :cards="testingCards"
                @edit-card="openEditModal"
                @delete-card="deleteCard"
                @move-forward="moveCardForward"
                @move-back="moveCardBack"
            ></kanban-column>
            
            <kanban-column 
                title="Выполнение задачи" 
                columnType="completed"
                :cards="completedCards"
                @edit-card="openEditModal"
                @delete-card="deleteCard"
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
            this.currentCard = {
                id: card.id,
                title: card.title,
                description: card.description,
                deadline: card.deadline
            };
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
                    id: this.currentCard.id,
                    createdAt: this.currentCard.createdAt,
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
        checkDeadline(card) {
            if (!card.deadline) return false;
            const deadline = new Date(card.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return deadline < today;
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

            else if (this.inProgressCards.find(c => c.id === card.id)) {
                this.inProgressCards = this.inProgressCards.filter(c => c.id !== card.id);
                this.testingCards.push(updatedCard);
            }

            else if (this.testingCards.find(c => c.id === card.id)) {
                this.testingCards = this.testingCards.filter(c => c.id !== card.id);

                const isOverdue = this.checkDeadline(card);
                const finalCard = {
                    ...updatedCard,
                    status: isOverdue ? 'overdue' : 'completed'
                };
                this.completedCards.push(finalCard);
            }
        },
        moveCardBack(card, reason) {
            const updatedCard = {
                ...card,
                lastEdited: new Date().toISOString(),
                returnReason: reason || 'Не указана'
            };

            if (this.testingCards.find(c => c.id === card.id)) {
                this.testingCards = this.testingCards.filter(c => c.id !== card.id);
                this.inProgressCards.push(updatedCard);
            }
        }
    }
});

let app = new Vue({
    el: '#app'
});