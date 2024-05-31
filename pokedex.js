let offset = 0;
const limit = 24;

document.addEventListener("DOMContentLoaded", () => {
    loadMorePokemons();
});

async function loadMorePokemons() {
    showLoading(true); // Exibe o loading antes de carregar mais Pokémon

    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao carregar Pokémon');
        }
        const data = await response.json();
        
        // Organiza os resultados da API por ID de Pokémon
        const sortedPokemon = data.results.sort((a, b) => {
            const idA = parseInt(a.url.split('/').slice(-2)[0]);
            const idB = parseInt(b.url.split('/').slice(-2)[0]);
            return idA - idB;
        });
        
        // Exibe os cartões de Pokémon na lista
        displayPokemonList(sortedPokemon);

        // Atualiza o offset para a próxima requisição
        offset += limit;

        // Verifica se há mais Pokémon para carregar
        if (!data.next) {
            const loadMoreButton = document.getElementById('load-more');
            loadMoreButton.style.display = 'none'; // Oculta o botão "Ver Mais" se não houver mais Pokémon
        }

        setTimeout(() => {
            showLoading(false); // Remove o loading após exibir os Pokémon
        }, 1000); // Atraso de 2 segundos para remover o loading
    } catch (error) {
        console.error(error);
        showLoading(false); // Remove o loading em caso de erro
    }
}

async function searchPokemon() {
    const pokemonNameOrId = document.getElementById('pokemon-name').value.toLowerCase();

    try {
        showLoading(true); // Exibe o loading antes de fazer a busca

        const loadMoreButton = document.getElementById('load-more');
        const pokemonListDiv = document.getElementById('pokemon-list');

        // Se o campo de texto estiver vazio, faz um novo GET da API com offset = 0 e limit = offset
        if (pokemonNameOrId === '') {
            pokemonListDiv.innerHTML = ''; // Limpa o conteúdo da div .pokemon-list
            
            let url;
            if (offset === 0)
                url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${limit}`;
            else
                url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${offset}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Erro ao carregar Pokémon');
            }

            const data = await response.json();
            const sortedPokemon = data.results.sort((a, b) => {
                return a.id - b.id;
            });

            displayPokemonList(sortedPokemon); // Exibe os Pokémon carregados
            loadMoreButton.style.display = 'block'; // Mostra o botão "Ver Mais"
        } else {
            const url = `https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Pokémon não encontrado');
            }

            const data = await response.json();
            console.log('Dados do Pokémon:', data); // Verificar os dados do Pokémon no console
            hideOtherPokemonCards(data.name); // Oculta os outros cartões de Pokémon
            loadMoreButton.style.display = 'none'; // Oculta o botão "Ver Mais"
        }
    } catch (error) {
        console.error('Erro ao buscar o Pokémon:', error); // Exibir erro no console
        document.getElementById('search-result').innerHTML = '<p>Pokémon não encontrado!</p>';
    } finally {
        showLoading(false); // Remove o loading após a busca
    }
}

function hideOtherPokemonCards(pokemonName) {
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    pokemonCards.forEach(card => {
        const cardNameElement = card.querySelector('h3'); // Ajuste do seletor para buscar o elemento h3
        if (cardNameElement) {
            const cardName = cardNameElement.textContent.toLowerCase();
            if (cardName !== pokemonName) {
                card.style.display = 'none';
            } else {
                card.style.display = 'block';
            }
        }
    });
}

function showLoading(isLoading) {
    const overlay = document.getElementById('overlay');
    overlay.style.display = isLoading ? 'block' : 'none';
}

async function displayPokemonList(pokemons) {
    const pokemonListDiv = document.getElementById('pokemon-list');
    
    try {
        // Mapeia as respostas das requisições GET para os detalhes dos Pokémon
        const pokemonResponses = await Promise.all(pokemons.map(pokemonData => {
            const url = pokemonData.url;
            return fetch(url);
        }));

        // Extrai os dados JSON de todas as respostas
        const pokemonDetails = await Promise.all(pokemonResponses.map(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do Pokémon');
            }
            return response.json();
        }));

        // Organiza os detalhes dos Pokémon por ID
        const sortedPokemon = pokemonDetails.sort((a, b) => {
            return a.id - b.id;
        });

        // Cria os cartões de Pokémon e os adiciona ao elemento pai
        sortedPokemon.forEach(pokemon => {
            const pokemonCard = createPokemonCard(pokemon);
            pokemonListDiv.appendChild(pokemonCard);
        });
    } catch (error) {
        console.error(error);
    } finally {
        showLoading(false);
    }
}

function displaySearchResult(data) {
    const searchResultDiv = document.getElementById('search-result');
    searchResultDiv.innerHTML = ''; // Limpa resultados anteriores
    
    const pokemonInfoHTML = `
        <h2>${capitalizeFirstLetter(data.name)}</h2>
        <img src="${data.sprites.front_default}" alt="${data.name}">
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Altura:</strong> ${data.height} dm</p>
        <p><strong>Peso:</strong> ${data.weight} hg</p>
        <div class="type-container">
            ${data.types.map(typeInfo => `<span class="type ${typeInfo.type.name}">${capitalizeFirstLetter(typeInfo.type.name)}</span>`).join('')}
        </div>
        <p><strong>Habilidades:</strong> ${data.abilities.map(abilityInfo => capitalizeFirstLetter(abilityInfo.ability.name)).join(', ')}</p>
    `;
    
    searchResultDiv.innerHTML = pokemonInfoHTML;
    showLoading(false);
}

function createPokemonCard(data, id) {
    const pokemonCard = document.createElement('div');
    pokemonCard.className = 'pokemon-card';
    pokemonCard.setAttribute('data-id', id); // Adiciona o ID do Pokémon como atributo data-id

    pokemonCard.innerHTML = `
        <h3>${capitalizeFirstLetter(data.name)}</h3>
        <img src="${data.sprites.front_default}" alt="${data.name}">
    `;
    
    pokemonCard.addEventListener('click', () => showPokemonDetails(data));
    
    return pokemonCard;
}

function showPokemonDetails(data) {
    const modal = document.getElementById('pokemon-modal');
    const modalBody = document.getElementById('modal-body');

    const typesHTML = data.types.map(typeInfo => {
        const typeName = typeInfo.type.name;
        return `<span class="type-${typeName}">${capitalizeFirstLetter(typeName)}</span>`;
    }).join('');
    
    modalBody.innerHTML = `
        <h2>${capitalizeFirstLetter(data.name)}</h2>
        <img src="${data.sprites.front_default}" alt="${data.name}">
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Altura:</strong> ${data.height} dm</p>
        <p><strong>Peso:</strong> ${data.weight} hg</p>
        <div class="type-container">
            ${typesHTML}
        </div>
        <p><strong>Habilidades:</strong> ${data.abilities.map(abilityInfo => capitalizeFirstLetter(abilityInfo.ability.name)).join(', ')}</p>
    `;
    
    modal.style.display = 'flex';
    modalBody.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('pokemon-modal');
    modal.style.display = 'none';
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Close the modal when the user clicks anywhere outside of the modal content
window.onclick = function(event) {
    const modal = document.getElementById('pokemon-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

