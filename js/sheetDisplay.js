// Ensure the Google Charts library is loaded before running our drawing function
google.charts.setOnLoadCallback(drawSheet);

function drawSheet() {
    console.log("Starting drawSheet function");
    
    // Use TSV format explicitly
    var sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQq6mstc-Mc6OtR6foQvqH6OV3Sh4j1ZIf-TnUTyucN6aTM_jSZBD39Z12qYGsrr0LqYVkw_zIsHbtZ/pub?gid=1333961883&single=true&output=tsv';

    // Display loading message
    var dataContainer = document.getElementById('sheet-data-container');
    if (dataContainer) {
        dataContainer.innerHTML = '<p>Loading data... Please wait.</p>';
    } else {
        console.error("Container element 'sheet-data-container' not found in the DOM");
        return;
    }

    // Fetch TSV data directly
    try {
        console.log("Attempting to fetch TSV data from:", sheetUrl);
        
        fetch(sheetUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.status}`);
                }
                return response.text();
            })
            .then(tsvData => {
                console.log("TSV data received, first 100 chars:", tsvData.substring(0, 100));
                displayTSVData(tsvData);
            })
            .catch(error => {
                console.error("Fetch error:", error);
                displayError(`Failed to fetch data: ${error.message}`);
            });
    } catch (error) {
        console.error('Error in fetch setup:', error);
        displayError('Failed to set up data fetch. Please check the console for details.');
    }
}

function displayTSVData(tsvData) {
    var dataContainer = document.getElementById('sheet-data-container');
    if (!dataContainer) {
        console.error("Container not found for displaying TSV data");
        return;
    }
    
    try {
        // Parse TSV data (tab-separated)
        const rows = tsvData.split('\n');
        if (rows.length === 0) {
            displayError("No data found in the TSV");
            return;
        }
        
        // Create a wrapper div for the table with scrolling - adjust height to fit content
        let wrapperDiv = '<div class="table-wrapper" style="max-height: 70vh; overflow-y: auto; margin-bottom: 20px;">';
        
        // Create table HTML
        let tableHtml = wrapperDiv + '<table class="tsv-table" style="width:100%; border-collapse: collapse;">';
        
        // Add header row
        const headers = rows[0].split('\t');
        
        // Filter columns - specify which columns you want to display
        const columnsToShow = [11, 86, 87, 31, 47, 66, 68, 69, 3, 15, 1]; // Your selected columns
        
        // Create a sticky header
        tableHtml += '<thead style="position: sticky; top: 0; z-index: 1;"><tr>';
        columnsToShow.forEach(index => {
            if (index < headers.length) {
                tableHtml += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">${headers[index]}</th>`;
            }
        });
        tableHtml += '</tr></thead><tbody>';
        
        // Add data rows
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].trim() === '') continue; // Skip empty rows
            
            const cells = rows[i].split('\t');
            tableHtml += `<tr style="background-color: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">`;
            
            columnsToShow.forEach(index => {
                if (index < cells.length) {
                    tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;">${cells[index]}</td>`;
                } else {
                    tableHtml += `<td style="border: 1px solid #ddd; padding: 8px;"></td>`;
                }
            });
            
            tableHtml += '</tr>';
        }
        
        tableHtml += '</tbody></table></div>';
        
        // Create a container for search and pagination controls
        let controlsHtml = '<div class="table-controls" style="margin-bottom: 15px;">';
        controlsHtml += '<div class="search-container" style="margin-bottom: 10px;">';
        controlsHtml += '<input type="text" id="table-search" placeholder="Search table..." style="padding: 8px; width: 100%; max-width: 300px;">';
        controlsHtml += '</div>';
        
        // Add pagination controls
        controlsHtml += '<div class="pagination-controls" style="margin-bottom: 10px;">';
        controlsHtml += '<span>Rows per page: </span>';
        controlsHtml += '<select id="rows-per-page" style="margin-right: 15px; padding: 5px;">';
        controlsHtml += '<option value="10">10</option>';
        controlsHtml += '<option value="25">25</option>';
        controlsHtml += '<option value="50">50</option>';
        controlsHtml += '<option value="100">100</option>';
        controlsHtml += '<option value="all">All</option>';
        controlsHtml += '</select>';
        
        controlsHtml += '<button id="prev-page" style="margin-right: 5px; padding: 5px 10px;">Previous</button>';
        controlsHtml += '<span id="page-info" style="margin-right: 5px;">Page 1 of 1</span>';
        controlsHtml += '<button id="next-page" style="padding: 5px 10px;">Next</button>';
        controlsHtml += '</div></div>';
        
        // Combine controls and table
        dataContainer.innerHTML = controlsHtml + tableHtml;
        
        // Initialize pagination and search
        initializeTableControls();
        
        // Add CSS to fix the embedded-iframe-container
        const containerStyle = document.createElement('style');
        containerStyle.textContent = `
            .embedded-iframe-container {
                height: auto !important;
                min-height: 200px;
                padding-bottom: 20px !important;
            }
            .main-content {
                padding-bottom: 30px;
            }
        `;
        document.head.appendChild(containerStyle);
        
        console.log('TSV data displayed successfully');
    } catch (error) {
        console.error('Error parsing TSV data:', error);
        displayError(`Failed to parse TSV data: ${error.message}`);
    }
}

function initializeTableControls() {
    const searchInput = document.getElementById('table-search');
    const rowsPerPageSelect = document.getElementById('rows-per-page');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const table = document.querySelector('.tsv-table');
    const tableRows = table.querySelectorAll('tbody tr');
    
    let currentPage = 1;
    let rowsPerPage = 10;
    let filteredRows = Array.from(tableRows);
    
    // Function to update the table display
    function updateTable() {
        // First apply search filter
        const searchTerm = searchInput.value.toLowerCase();
        filteredRows = Array.from(tableRows).filter(row => {
            let found = false;
            const cells = row.querySelectorAll('td');
            
            cells.forEach(cell => {
                if (cell.textContent.toLowerCase().includes(searchTerm)) {
                    found = true;
                }
            });
            
            return found;
        });
        
        // Hide all rows first
        tableRows.forEach(row => {
            row.style.display = 'none';
        });
        
        // Calculate pagination
        const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredRows.length / rowsPerPage);
        currentPage = Math.min(currentPage, totalPages);
        currentPage = Math.max(1, currentPage);
        
        // Update page info
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        
        // Show rows for current page
        const startIndex = rowsPerPage === 'all' ? 0 : (currentPage - 1) * rowsPerPage;
        const endIndex = rowsPerPage === 'all' ? filteredRows.length : startIndex + parseInt(rowsPerPage);
        
        for (let i = startIndex; i < Math.min(endIndex, filteredRows.length); i++) {
            filteredRows[i].style.display = '';
        }
        
        // Update button states
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
    }
    
    // Add event listeners
    searchInput.addEventListener('keyup', function() {
        currentPage = 1;
        updateTable();
    });
    
    rowsPerPageSelect.addEventListener('change', function() {
        rowsPerPage = this.value;
        currentPage = 1;
        updateTable();
    });
    
    prevPageButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });
    
    nextPageButton.addEventListener('click', function() {
        const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredRows.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTable();
        }
    });
    
    // Initialize the table
    updateTable();
}

// Helper function to display errors to the user
function displayError(message) {
    var dataContainer = document.getElementById('sheet-data-container');
    if (dataContainer) {
        dataContainer.innerHTML = '<p style="color: red; padding: 10px;">' + message + '</p>';
    }
    console.error(message);
}