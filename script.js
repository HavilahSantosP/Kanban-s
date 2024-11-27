// Armazenar dados dos quadros
let boards = [];
let currentBoardIndex = 0;

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar quadros salvos do localStorage
    loadBoards();
    
    // Inicializar arrastar e soltar
    initializeDragAndDrop();
    
    // Inicializar botões
    initializeButtons();
    
    // Inicializar post-its existentes
    initializeExistingNotes();
});

// Carregar quadros do localStorage
function loadBoards() {
    const savedBoards = localStorage.getItem('kanbanBoards');
    if (savedBoards) {
        boards = JSON.parse(savedBoards);
        if (boards.length === 0) {
            createNewBoard();
        }
    } else {
        createNewBoard();
    }
    renderCurrentBoard();
}

// Criar um novo quadro
function createNewBoard() {
    const newBoard = {
        id: Date.now(),
        name: `Board ${boards.length + 1}`,
        notes: []
    };
    boards.push(newBoard);
    currentBoardIndex = boards.length - 1;
    saveBoards();
}

// Salvar quadros no localStorage
function saveBoards() {
    localStorage.setItem('kanbanBoards', JSON.stringify(boards));
}

// Inicializar funcionalidade de arrastar e soltar
function initializeDragAndDrop() {
    const kanbanBoard = document.getElementById('kanbanBoard');
    const stickyNoteIcons = document.querySelectorAll('.sticky-note-icon');

    stickyNoteIcons.forEach(icon => {
        icon.addEventListener('dragstart', handleIconDragStart);
        icon.addEventListener('dragend', handleDragEnd);
    });

    kanbanBoard.addEventListener('dragover', handleDragOver);
    kanbanBoard.addEventListener('drop', handleDrop);
}

// Manipuladores de eventos de arrastar e soltar
function handleIconDragStart(e) {
    e.dataTransfer.setData('text/plain', 'Click to edit');
    e.dataTransfer.setData('color', e.target.style.backgroundColor);
    e.dataTransfer.setData('source', 'palette');
}

function handleNoteDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.querySelector('.note-content').innerHTML);
    e.dataTransfer.setData('color', e.target.style.backgroundColor);
    e.dataTransfer.setData('source', 'board');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const content = e.dataTransfer.getData('text/plain');
    const color = e.dataTransfer.getData('color');
    const source = e.dataTransfer.getData('source');

    const dropzone = e.target.closest('.dropzone');
    if (!dropzone) return;

    const rect = dropzone.getBoundingClientRect();

    if (source === 'board') {
        const draggedNote = document.querySelector('.dragging');
        if (draggedNote) {
            draggedNote.style.left = `${e.clientX - rect.left}px`;
            draggedNote.style.top = `${e.clientY - rect.top}px`;
            dropzone.appendChild(draggedNote);
        }
    } else {
        const newNote = createStickyNote(content, color);
        newNote.style.left = `${e.clientX - rect.left}px`;
        newNote.style.top = `${e.clientY - rect.top}px`;
        dropzone.appendChild(newNote);
    }

    updateBoardState();
}

// Criar um novo elemento de post-it
function createStickyNote(content, color) {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.draggable = true;
    note.style.backgroundColor = color;
    note.style.position = 'absolute';
    
    const noteContent = document.createElement('div');
    noteContent.className = 'note-content';
    noteContent.contentEditable = true;
    noteContent.innerHTML = content;
    note.appendChild(noteContent);
    
    note.addEventListener('dragstart', handleNoteDragStart);
    note.addEventListener('dragend', handleDragEnd);
    note.addEventListener('contextmenu', handleContextMenu);
    
    let isDragging = false;
    let startX, startY;

    note.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - note.offsetLeft;
        startY = e.clientY - note.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            note.style.left = `${e.clientX - startX}px`;
            note.style.top = `${e.clientY - startY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            updateBoardState();
        }
    });
    
    return note;
}

// Manipular menu de contexto
function handleContextMenu(e) {
    e.preventDefault();
    const note = e.target.closest('.sticky-note');
    if (note) {
        const menu = createContextMenu(note);
        document.body.appendChild(menu);
        
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;
        
        document.addEventListener('click', () => menu.remove(), { once: true });
    }
}

// Criar menu de contexto
function createContextMenu(note) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-option';
    deleteOption.textContent = 'Deletar';
    deleteOption.addEventListener('click', () => {
        note.remove();
        updateBoardState();
    });
    
    menu.appendChild(deleteOption);
    return menu;
}

// Inicializar botões
function initializeButtons() {
    const newBoardBtn = document.getElementById('newBoardBtn');
    const folderBtn = document.getElementById('folderBtn');
    const savedBoards = document.getElementById('savedBoards');

    newBoardBtn.addEventListener('click', () => {
        createNewBoard();
        renderCurrentBoard();
    });

    folderBtn.addEventListener('click', () => {
        savedBoards.classList.toggle('hidden');
        renderSavedBoards();
    });
}

// Renderizar o quadro atual
function renderCurrentBoard() {
    const board = boards[currentBoardIndex];
    if (!board) return;

    document.querySelectorAll('.dropzone').forEach(zone => {
        zone.innerHTML = '';
    });

    if (board.notes) {
        board.notes.forEach(note => {
            const noteElement = createStickyNote(note.content, note.color);
            noteElement.style.left = `${note.x}px`;
            noteElement.style.top = `${note.y}px`;
            const column = document.querySelector(`[data-column="${note.column}"]`);
            if (column) {
                column.appendChild(noteElement);
            }
        });
    }

    initializeExistingNotes();
}

// Renderizar quadros salvos na pasta
function renderSavedBoards() {
    const savedBoardsContainer = document.getElementById('savedBoards');
    savedBoardsContainer.innerHTML = '';

    boards.forEach((board, index) => {
        const boardItem = document.createElement('div');
        boardItem.className = 'saved-board-item';
        boardItem.textContent = board.name;
        boardItem.addEventListener('click', () => {
            currentBoardIndex = index;
            renderCurrentBoard();
            savedBoardsContainer.classList.add('hidden');
        });
        boardItem.addEventListener('contextmenu', (e) => handleBoardContextMenu(e, index));
        savedBoardsContainer.appendChild(boardItem);
    });
}

// Manipular menu de contexto para boards salvos
function handleBoardContextMenu(e, boardIndex) {
    e.preventDefault();
    const menu = createBoardContextMenu(boardIndex);
    document.body.appendChild(menu);
    
    menu.style.top = `${e.clientY}px`;
    menu.style.left = `${e.clientX}px`;
    
    document.addEventListener('click', () => menu.remove(), { once: true });
}

// Criar menu de contexto para boards salvos
function createBoardContextMenu(boardIndex) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    
    const deleteOption = document.createElement('div');
    deleteOption.className = 'context-menu-option';
    deleteOption.textContent = 'Deletar';
    deleteOption.addEventListener('click', () => {
        if (confirm('Você tem certeza que quer deletar esse Kanban?')) {
            deleteBoard(boardIndex);
        }
    });
    
    menu.appendChild(deleteOption);
    return menu;
}

// Deletar um board salvo
function deleteBoard(index) {
    boards.splice(index, 1);
    if (boards.length === 0) {
        createNewBoard();
    } else if (currentBoardIndex >= index) {
        currentBoardIndex = Math.max(0, currentBoardIndex - 1);
    }
    saveBoards();
    renderSavedBoards();
    renderCurrentBoard();
}

// Atualizar estado do quadro quando ocorrem mudanças
function updateBoardState() {
    const board = boards[currentBoardIndex];
    board.notes = [];

    document.querySelectorAll('.sticky-note').forEach(note => {
        const column = note.closest('.dropzone').dataset.column;
        const rect = note.getBoundingClientRect();
        const dropzone = note.closest('.dropzone');
        const dropzoneRect = dropzone.getBoundingClientRect();

        board.notes.push({
            content: note.querySelector('.note-content').innerHTML,
            color: note.style.backgroundColor,
            x: rect.left - dropzoneRect.left,
            y: rect.top - dropzoneRect.top,
            column: column
        });
    });

    saveBoards();
}

// Inicializar post-its existentes
function initializeExistingNotes() {
    document.querySelectorAll('.sticky-note').forEach(note => {
        note.draggable = true;
        note.addEventListener('dragstart', handleNoteDragStart);
        note.addEventListener('dragend', handleDragEnd);
        note.addEventListener('contextmenu', handleContextMenu);
        
        const noteContent = note.querySelector('.note-content');
        if (!noteContent) {
            const newNoteContent = document.createElement('div');
            newNoteContent.className = 'note-content';
            newNoteContent.contentEditable = true;
            newNoteContent.innerHTML = note.innerHTML;
            note.innerHTML = '';
            note.appendChild(newNoteContent);
        }

        noteContent.addEventListener('input', updateBoardState);

        let isDragging = false;
        let startX, startY;

        note.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = note.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dropzone = note.closest('.dropzone');
                const rect = dropzone.getBoundingClientRect();
                note.style.left = `${e.clientX - rect.left - startX}px`;
                note.style.top = `${e.clientY - rect.top - startY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                updateBoardState();
            }
        });
    });
}

