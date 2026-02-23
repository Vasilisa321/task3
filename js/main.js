Vue.component('kanban-column', {
    props: {
        title: {
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
            <slot></slot>
        </div>
    `
});

Vue.component('kanban-board', {
    template: `
        <div class="kanban-board">
            <kanban-column title="Запланированные задачи" :cards="plannedCards">
            </kanban-column>
            
            <kanban-column title="Задачи в работе" :cards="inProgressCards">
            </kanban-column>
            
            <kanban-column title="Тестирование" :cards="testingCards">
            </kanban-column>
            
            <kanban-column title="Выполнение задачи" :cards="completedCards">
            </kanban-column>
        </div>
    `,
    data() {
        return {
            plannedCards: [],
            inProgressCards: [],
            testingCards: [],
            completedCards: []
        };
    }
});


let app = new Vue({
    el: '#app'
});