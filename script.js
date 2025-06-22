document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabs = document.querySelectorAll('.nav-tab');
    const tabSections = document.querySelectorAll('.container > section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            tabSections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // User's book collection
    let myBooks = JSON.parse(localStorage.getItem('myBooks')) || [];
    
    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderBooks();
        });
    });
    
    // Render books in their respective sections
    function renderBooks() {
        const libraryGrid = document.getElementById('library-books');
        const wantToReadGrid = document.getElementById('want-to-read-books');
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        
        // Clear existing content
        libraryGrid.innerHTML = '';
        wantToReadGrid.innerHTML = '';
        
        // Filter books by status
        const libraryBooks = myBooks.filter(book => 
            (book.status === 'reading' || book.status === 'finished') && 
            (activeFilter === 'all' || book.status === activeFilter)
        );
        const wantToReadBooks = myBooks.filter(book => book.status === 'want-to-read');
        
        // Show message if no books
        if (libraryBooks.length === 0) {
            libraryGrid.innerHTML = '<div class="empty-message">No books in your library yet</div>';
        }
        
        if (wantToReadBooks.length === 0) {
            wantToReadGrid.innerHTML = '<div class="empty-message">No books in your want to read list</div>';
        }
        
        // Render library books
        libraryBooks.forEach(book => {
            libraryGrid.appendChild(createBookCard(book));
        });
        
        // Render want to read books
        wantToReadBooks.forEach(book => {
            wantToReadGrid.appendChild(createBookCard(book));
        });
    }
    
    // Create a book card element
    function createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.id = book.id;
        
        // Calculate progress percentage
        const progress = book.chapters > 0 ? Math.round((book.currentChapter / book.chapters) * 100) : 0;
        
        card.innerHTML = `
            <img src="${book.cover || 'https://via.placeholder.com/200x300?text=No+Cover'}" 
                 alt="${book.title}" 
                 class="book-cover"
                 onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                ${book.status !== 'want-to-read' ? `
                <div class="book-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-text">
                        <span>Chapter ${book.currentChapter}/${book.chapters || '?'}</span>
                        <span>${progress}%</span>
                    </div>
                </div>
                ` : ''}
                <div class="book-actions">
                    ${book.status === 'want-to-read' ? `
                    <button class="action-btn primary-btn start-reading-btn">
                        <i class="fas fa-book-open"></i> Start
                    </button>
                    ` : `
                    <button class="action-btn primary-btn update-progress-btn">
                        <i class="fas fa-edit"></i> Update
                    </button>
                    `}
                    <button class="action-btn secondary-btn remove-btn">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `;
        
        // Add click event to show book details
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-btn') && !e.target.closest('.action-btn')) {
                showBookDetails(book);
            }
        });
        
        // Add event listeners to buttons
        if (book.status === 'want-to-read') {
            card.querySelector('.start-reading-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                updateBookStatus(book.id, 'reading');
            });
        } else {
            card.querySelector('.update-progress-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showUpdateChapterModal(book);
            });
        }
        
        card.querySelector('.remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            removeBook(book.id);
        });
        
        return card;
    }
    
    // Show book details in modal
    function showBookDetails(book) {
        const modal = document.getElementById('book-modal');
        const modalBody = document.querySelector('.modal-body');
        const progress = book.chapters > 0 ? Math.round((book.currentChapter / book.chapters) * 100) : 0;
        
        modalBody.innerHTML = `
            <div class="modal-header">
                <img src="${book.cover || 'https://via.placeholder.com/300x450?text=No+Cover'}" 
                     alt="${book.title}" 
                     class="modal-cover"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Cover'">
                <div>
                    <h2 class="modal-title">${book.title}</h2>
                    <p class="modal-author">by ${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                    ${book.status !== 'want-to-read' ? `
                    <div class="book-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>Chapter ${book.currentChapter}/${book.chapters || '?'}</span>
                            <span>${progress}%</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-description">
                <h3>Description</h3>
                <p>${book.description || 'No description available.'}</p>
            </div>
            <div class="modal-details">
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span>${formatStatus(book.status)}</span>
                </div>
                ${book.publishedDate ? `
                <div class="detail-item">
                    <span class="detail-label">Published:</span>
                    <span>${book.publishedDate}</span>
                </div>
                ` : ''}
                ${book.pageCount ? `
                <div class="detail-item">
                    <span class="detail-label">Pages:</span>
                    <span>${book.pageCount}</span>
                </div>
                ` : ''}
                ${book.status !== 'want-to-read' ? `
                <div class="detail-item">
                    <span class="detail-label">Current Chapter:</span>
                    <span>${book.currentChapter}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Progress:</span>
                    <span>${progress}%</span>
                </div>
                ` : ''}
            </div>
            ${book.status !== 'want-to-read' ? `
            <div class="chapter-controls">
                <h3>Update Progress</h3>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="number" class="chapter-input" min="0" max="${book.chapters || ''}" value="${book.currentChapter}">
                    <button class="update-btn">Update</button>
                </div>
            </div>
            ` : `
            <button class="action-btn primary-btn" style="width: 100%; padding: 1rem;">
                <i class="fas fa-book-open"></i> Start Reading
            </button>
            `}
        `;
        
        // Add event listener to update button if it exists
        if (book.status !== 'want-to-read') {
            modalBody.querySelector('.update-btn').addEventListener('click', () => {
                const newChapter = parseInt(modalBody.querySelector('.chapter-input').value);
                if (!isNaN(newChapter)) {
                    updateBookChapter(book.id, newChapter);
                    modal.style.display = 'none';
                }
            });
        } else {
            modalBody.querySelector('.action-btn').addEventListener('click', () => {
                updateBookStatus(book.id, 'reading');
                modal.style.display = 'none';
            });
        }
        
        modal.style.display = 'flex';
    }
    
    // Format status for display
    function formatStatus(status) {
        const statusMap = {
            'reading': 'Currently Reading',
            'finished': 'Finished',
            'want-to-read': 'Want to Read'
        };
        return statusMap[status] || status;
    }
    
    // Close modal when clicking the X button
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('book-modal').style.display = 'none';
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('book-modal')) {
            document.getElementById('book-modal').style.display = 'none';
        }
    });
    
    // Update book chapter
    function updateBookChapter(bookId, newChapter) {
        const book = myBooks.find(b => b.id === bookId);
        if (book) {
            book.currentChapter = newChapter;
            if (book.chapters && newChapter === book.chapters) {
                book.status = 'finished';
            }
            saveBooks();
            renderBooks();
        }
    }
    
    // Update book status
    function updateBookStatus(bookId, newStatus) {
        const book = myBooks.find(b => b.id === bookId);
        if (book) {
            book.status = newStatus;
            if (newStatus === 'reading' && book.currentChapter === 0) {
                book.currentChapter = 1; // Start at chapter 1 when beginning to read
            }
            saveBooks();
            renderBooks();
        }
    }
    
    // Remove book
    function removeBook(bookId) {
        myBooks = myBooks.filter(b => b.id !== bookId);
        saveBooks();
        renderBooks();
    }
    
    // Save books to localStorage
    function saveBooks() {
        localStorage.setItem('myBooks', JSON.stringify(myBooks));
    }
    
    // Search Google Books API
    const searchInput = document.getElementById('book-search');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    
    async function searchBooks(query) {
        try {
            searchResults.innerHTML = '<div class="search-info">Searching...</div>';
            const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`
            );
            const data = await response.json();
            
            if (!data.items || data.items.length === 0) {
                searchResults.innerHTML = '<div class="search-info">No books found. Try a different search.</div>';
                return;
            }
            
            displaySearchResults(data.items);
        } catch (error) {
            console.error('Error searching books:', error);
            searchResults.innerHTML = '<div class="search-error">Error searching for books. Please try again.</div>';
        }
    }
    
    function displaySearchResults(books) {
        searchResults.innerHTML = '';
        
        books.forEach(bookData => {
            const book = {
                id: bookData.id,
                title: bookData.volumeInfo.title || 'Unknown Title',
                authors: bookData.volumeInfo.authors,
                description: bookData.volumeInfo.description,
                cover: bookData.volumeInfo.imageLinks?.thumbnail.replace('http://', 'https://'),
                publishedDate: bookData.volumeInfo.publishedDate,
                pageCount: bookData.volumeInfo.pageCount,
                chapters: bookData.volumeInfo.pageCount ? Math.ceil(bookData.volumeInfo.pageCount / 20) : 20, // Estimate chapters
                currentChapter: 0,
                status: 'none'
            };
            
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <img src="${book.cover || 'https://via.placeholder.com/50x75?text=No+Cover'}" 
                     alt="${book.title}"
                     onerror="this.src='https://via.placeholder.com/50x75?text=No+Cover'">
                <div class="search-result-info">
                    <h4>${book.title}</h4>
                    <p>${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
                    <div class="search-result-actions">
                        <button class="action-btn primary-btn add-to-library">
                            <i class="fas fa-book-open"></i> Add to Library
                        </button>
                        <button class="action-btn secondary-btn add-to-want">
                            <i class="fas fa-bookmark"></i> Want to Read
                        </button>
                    </div>
                </div>
            `;
            
            resultItem.querySelector('.add-to-library').addEventListener('click', () => {
                if (!myBooks.some(b => b.id === book.id)) {
                    book.status = 'reading';
                    book.currentChapter = 1;
                    myBooks.push(book);
                    saveBooks();
                    renderBooks();
                    alert('Added to your library!');
                } else {
                    alert('This book is already in your collection');
                }
            });
            
            resultItem.querySelector('.add-to-want').addEventListener('click', () => {
                if (!myBooks.some(b => b.id === book.id)) {
                    book.status = 'want-to-read';
                    myBooks.push(book);
                    saveBooks();
                    renderBooks();
                    alert('Added to your want to read list!');
                } else {
                    alert('This book is already in your collection');
                }
            });
            
            searchResults.appendChild(resultItem);
        });
    }
    
    // Event listeners for search
    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query.length > 0) {
            searchBooks(query);
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length > 0) {
                searchBooks(query);
            }
        }
    });
    
    // Initial render
    renderBooks();
});
// Add these changes to your existing script.js file

// 1. Add this helper function to hide the search section
function hideSearchSection() {
    document.querySelector('.search-section').classList.remove('active');
    document.querySelector('[data-tab="search"]').classList.remove('active');
    
    // Show the library section by default
    document.querySelector('[data-tab="library"]').classList.add('active');
    document.querySelector('.library-section').classList.add('active');
}

// 2. Modify the event listeners for adding books
// In the displaySearchResults function, update the click handlers:
resultItem.querySelector('.add-to-library').addEventListener('click', () => {
    if (!myBooks.some(b => b.id === book.id)) {
        book.status = 'reading';
        book.currentChapter = 1;
        myBooks.push(book);
        saveBooks();
        renderBooks();
        hideSearchSection(); // Add this line
        // Remove the alert since the UI change is more intuitive
    } else {
        alert('This book is already in your collection');
    }
});

resultItem.querySelector('.add-to-want').addEventListener('click', () => {
    if (!myBooks.some(b => b.id === book.id)) {
        book.status = 'want-to-read';
        myBooks.push(book);
        saveBooks();
        renderBooks();
        hideSearchSection(); // Add this line
        // Remove the alert since the UI change is more intuitive
    } else {
        alert('This book is already in your collection');
    }
});

// 3. Add this to ensure search bar clears when switching tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Clear search results when switching tabs
        if (tab.getAttribute('data-tab') !== 'search') {
            searchResults.innerHTML = '<div class="search-info">Search for books using the Google Books API</div>';
            searchInput.value = '';
        }
    });
});