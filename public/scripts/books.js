
// Fetch books data from the backend
async function fetchBooks() {
    try {
        const response = await fetch('/books');
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        console.error(error.message);
    }
}

// Display books dynamically
function displayBooks(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; // Clear previous content

    books.forEach(book => {
        // Create a card
        const bookCard = document.createElement('div');
        bookCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl';

        // Card content
        bookCard.innerHTML = `
                <div
                    class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg"
                    data-image="${book.image}"
                    data-bookname="${book.bookname}"
                    data-username=" ${book.username}"
                    data-price="${book.price}"
                    data-publication="${book.publication}"
                    data-description="${book.description}"
                    onclick="handleBookCardClick(this)"
                    >
                    <img src="https://via.placeholder.com/300x400" alt="Book" class="w-full h-40 object-cover" />
                    <div class="p-4">
                        <h2 class="text-lg font-bold mb-2">${book.bookname}</h2>
                        <p class="text-gray-600 mb-2"><strong>Price:</strong>₹ ${book.price}</p>
                        <p class="text-gray-600 mb-2"><strong>Posted By:</strong> ${book.username}</p>
                        <p class="text-gray-600 mb-2"><strong>Publication:</strong> ${book.publication}</p>
                        <p class="text-gray-500 text-sm">${book.description}</p>
                    </div>
                </div>
            `;

        // Append the card to the list
        bookList.appendChild(bookCard);
    });
};


function handleBookCardClick(element) {
const book = {
image: element.dataset.image,
bookname: element.dataset.bookname,
username: element.dataset.username,
price: element.dataset.price,
publication: element.dataset.publication,
description: element.dataset.description,
};
openBookModal(book);
}

// Call this function on every page load
async function  openBookModal(book) {

let response = await
        fetch('/Fetch-comments', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"  // Specify that the request body is in JSON format
            },
            body: JSON.stringify({  // Convert the object to a JSON string
                BookID: book.bookname,
                PostedBy: book.username
            })
        })

response = await response.json()
let comments =[];
for (let i = 0; i < response.length; i++) {
    comments.push(response[i]);
}


document.querySelector("input[name='Comments']").value = '';

document.getElementById("bookImage").src = "https://via.placeholder.com/300x400";
document.getElementById("bookName").textContent = book.bookname;
document.getElementById("hiddenBookName").value = book.bookname;
document.getElementById("hiddenBookPostedByName").value = book.username;
document.getElementById("bookPostedBy").innerHTML = `<strong>Posted By:</strong> ${book.username}`;
document.getElementById("bookPrice").innerHTML = `<strong>Price:</strong> ₹${book.price}`;
document.getElementById("bookPublication").innerHTML = `<strong>Publication:</strong> ${book.publication}`;
document.getElementById("bookDescription").textContent = book.description;

const commentsSection = document.getElementById("commentsSection");
commentsSection.innerHTML = comments
.map(
  (comment) => `
<div class="mb-4">
  <p class="font-bold text-blue-500">${comment.Username}</p>
  <p class="text-gray-700">${comment.Comment}</p>
</div>
`
)
.join("");

document.getElementById("bookModal").classList.remove("hidden");
}

function closeBookModal() {
document.querySelector("input[name='Comments']").value = '';
document.getElementById("bookModal").classList.add("hidden");
}
async function searchFetch() {
    try {
        const response = await fetch('/api/books');
        if (!response.ok) {
            throw new Error('Failed to fetch books');
        }
        const books = await response.json();
        return books;
    } catch (error) {
        console.error(error.message);
        return [];
    }
}
const searchBar = document.getElementById('searchBar');
searchBar.addEventListener('input', async (e) => {
    const searchQuery = e.target.value.toLowerCase();
    const books = await searchFetch();
    const filteredBooks = books.filter(book =>
        book.bookname.toLowerCase().includes(searchQuery) || book.description.toLowerCase().includes(searchQuery)
    );
    displayBooks(filteredBooks); // Display filtered books
});




document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    const comment = document.getElementById('commentInput').value;
    const bookID = document.getElementById('hiddenBookName').value;
    const postedBy = document.getElementById('hiddenBookPostedByName').value;

    if (!comment || !bookID || !postedBy) {
      alert('Please fill in all fields');
      return;
    }

    // Post the comment
    const response = await fetch('/CommentAdd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BookID: bookID,
        Comments: comment,
        PostedBy: postedBy,
      }),
    });

    if (!response.ok) {
      alert('you can post only one comment try to delete and post only necessary details so the owner of book can approcah you!');
      return;
    }

    // Clear the comment input
    document.getElementById('commentInput').value = '';

    // Fetch the updated comments
    const fetchResponse = await fetch('/Fetch-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BookID: bookID,
        PostedBy: postedBy,
      }),
    });

    if (fetchResponse.ok) {
      const comments = await fetchResponse.json();
      updateCommentsUI(comments); // Update the comments UI with new comments
    } else {
      alert('Failed to fetch comments');
    }
  });

  // Function to update the comments section
  function updateCommentsUI(comments) {
    const commentsSection = document.getElementById('commentsSection');
    commentsSection.innerHTML = ''; // Clear existing comments

    // Render each comment dynamically
    comments.forEach(comment => {
      const commentElement = document.createElement('div');
      commentElement.classList.add('comment');
      commentElement.innerHTML = `
        <div class="mb-4">
        <p class="font-bold text-blue-500">${comment.Username}</p>
        <p class="text-gray-700">${comment.Comment}</p>
        </div>
      `;
      commentsSection.appendChild(commentElement);
    });
  }
// Load books when the page loads
document.addEventListener('DOMContentLoaded', fetchBooks);
