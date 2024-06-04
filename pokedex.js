let offset = 0;
const limit = 24;

document.addEventListener('DOMContentLoaded', () => {
    // Obter pokemons.
    loadMorePokemons();

    const searchInput = document.getElementById('pokemon-name');
    // Adiciona um evento para buscar ao pressionar Enter
    searchInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            searchPokemon();
        }
    });
});

// Função para obter os pokemons
async function loadMorePokemons() {
    showLoading(true);

    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao carregar Pokemon');
        }
        const data = await response.json();
        
        const sortedPokemon = data.results.sort((a, b) => {
            const idA = parseInt(a.url.split('/').slice(-2)[0]);
            const idB = parseInt(b.url.split('/').slice(-2)[0]);
            return idA - idB;
        });
        
        // Exibe os cards dos pokemons na lista
        displayPokemonList(sortedPokemon);

        // Atualiza o offset para a próxima requisição
        offset += limit;

        // Verifica se há mais pokemons para carregar
        if (!data.next) {
            const loadMoreButton = document.getElementById('load-more');
            loadMoreButton.style.display = 'none'; // Oculta o botão "Ver Mais" se não houver mais pokemon
        }

        setTimeout(() => {
            showLoading(false);
        }, 1000); 
    } catch (error) {
        console.error(error);
        showLoading(false);
    }
}

// Função de busca dos pokemons por número da pokedex ou nome
async function searchPokemon() {
    const pokemonNameOrId = document.getElementById('pokemon-name').value.toLowerCase();

    try {
        const loadMoreButton = document.getElementById('load-more');
        const pokemonListDiv = document.getElementById('pokemon-list');
        const searchResultDiv = document.getElementById('search-result');

        // Se o campo de texto estiver vazio, faz um novo GET da API com offset = 0 e limit = offset
        if (pokemonNameOrId === '') {
            showLoading(true);
            pokemonListDiv.innerHTML = ''; // Limpa o conteúdo da div .pokemon-list
            searchResultDiv.innerHTML = ''; // Limpa busca anterior
            
            let url;
            if (offset === 0)
                url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${limit}`;
            else
                url = `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${offset}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Erro ao carregar Pokemon');
            }

            const data = await response.json();
            const sortedPokemon = data.results.sort((a, b) => {
                return a.id - b.id;
            });

            displayPokemonList(sortedPokemon); // Exibe os pokemon carregados
            loadMoreButton.style.display = 'block'; // Mostra o botão "Ver Mais"
        } else if (pokemonNameOrId.length >= 3) {
            showLoading(true); // Exibe o loading antes de fazer a busca
            pokemonListDiv.innerHTML = ''; // Limpa o conteúdo da div .pokemon-list
            searchResultDiv.innerHTML = ''; // Limpa qualquer mensagem de busca anterior

            const url = `https://pokeapi.co/api/v2/pokemon?limit=1000`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Erro ao carregar pokemon');
            }

            const data = await response.json();
            const filteredPokemon = data.results.filter(pokemon => pokemon.name.includes(pokemonNameOrId));
            const sortedPokemon = filteredPokemon.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            if (sortedPokemon.length === 0) {
                searchResultDiv.innerHTML = '<p>Nenhum Pokemon encontrado!</p>';
            } else {
                displayPokemonList(sortedPokemon); // Exibe os Pokemon filtrados
            }

            loadMoreButton.style.display = 'none'; // Oculta o botão "Ver Mais"
        } else {
            searchResultDiv.innerHTML = '<p>Digite pelo menos 3 letras para buscar um Pokemon!</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar o Pokemon:', error);
        document.getElementById('search-result').innerHTML = '<p>Pokemon não encontrado!</p>';
    } finally {
        // Remove o loading após a busca e exibição dos Pokemon
        setTimeout(() => {
            showLoading(false);
        }, 2000);
    }
}

function hideOtherPokemonCards(pokemonName) {
    const pokemonCards = document.querySelectorAll('.pokemon-card');
    pokemonCards.forEach(card => {
        const cardNameElement = card.querySelector('h3');
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
        // Mapeia as respostas das requisições GET para os detalhes dos Pokemon
        const pokemonResponses = await Promise.all(pokemons.map(pokemonData => {
            const url = pokemonData.url;
            return fetch(url);
        }));

        const pokemonDetails = await Promise.all(pokemonResponses.map(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do Pokemon');
            }
            return response.json();
        }));

        const sortedPokemon = pokemonDetails.sort((a, b) => {
            return a.id - b.id;
        });

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
    pokemonCard.setAttribute('data-id', id);

    pokemonCard.innerHTML = `
        <h3>${capitalizeFirstLetter(data.name)}</h3>
        <img src="${data.sprites.front_default}" alt="${data.name}">
    `;
    
    pokemonCard.addEventListener('click', () => showPokemonDetails(data));
    
    return pokemonCard;
}

async function getEvolutionChain(evolutionChainUrl) {
    try {
        const response = await fetch(evolutionChainUrl);
        if (!response.ok) {
            throw new Error('Erro ao carregar cadeia de evolução');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar a cadeia de evolução:', error);
        return null;
    }
}

async function getPokemonSpecies(pokemonId) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}/`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da espécie');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao buscar a espécie do Pokemon:', error);
        return null;
    }
}

async function showPokemonDetails(data) {
    const modal = document.getElementById('pokemon-modal');
    const modalBody = document.getElementById('modal-body');

    showLoading(true);

    const typesHTML = data.types.map(typeInfo => {
        const typeName = typeInfo.type.name;
        return `<span class="type-${typeName}">${capitalizeFirstLetter(typeName)}</span>`;
    }).join('');

    const speciesData = await getPokemonSpecies(data.id);
    if (!speciesData) {
        return;
    }

    const evolutionChainUrl = speciesData.evolution_chain.url;
    const evolutionData = await getEvolutionChain(evolutionChainUrl);
    if (!evolutionData) {
        return;
    }

    let preEvolutionsHTML = '<div class="evolutions-container"></div>';
    let evolutionsHTML = '<div class="evolutions-container"></div>';
    let evolutionsHTMLArray = '';
    let currentEvolution = evolutionData.chain;

    const createPreEvolutionHTML = (evolution) => `
        <div class="evolutions-container">
            <div class="evolutions">
                <div class="evolution-item">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolution.species.url.split('/')[6]}.png" class="evolution-item-img" onclick="getPokemonByName('${evolution.species.name}')">
                </div>                
            </div>
            <div class="evolution-arrow"></div>
        </div>
    `;

    const createEvolutionsHTMLArray = (evolution) => `        
        <div class="evolution-item">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evolution.species.url.split('/')[6]}.png" class="evolution-item-img" onclick="getPokemonByName('${evolution.species.name}')">
        </div>
    `

    const createEvolutionHTML = () => `
        <div class="evolutions-container">
            <div class="evolution-arrow"></div>
            <div class="evolutions"> 
                ${evolutionsHTMLArray}
            </div>
        </div>
    `;

    while (currentEvolution) {
        // Verifica se há mais de uma evolução possível e se o nome da espécie atual é diferente do Pokemon selecionado
        if (currentEvolution.evolves_to.length > 1 && currentEvolution.species.name !== data.name) {
            // Define o pokemon inicial da cadeia de evoluções, como pré-evolução
            preEvolutionsHTML = createPreEvolutionHTML(currentEvolution);
            break;
        } else {
            if (currentEvolution.species.name === data.name) {
                break;
            }
            preEvolutionsHTML = createPreEvolutionHTML(currentEvolution);
            currentEvolution = currentEvolution.evolves_to[0];
        }
    }

    currentEvolution = evolutionData.chain;
    while (currentEvolution && currentEvolution.species.name !== data.name) {
        currentEvolution = currentEvolution.evolves_to[0];
    }
    if (currentEvolution && currentEvolution.evolves_to.length > 0) {        
        currentEvolution.evolves_to.forEach(evo => {            
            evolutionsHTMLArray += createEvolutionsHTMLArray(evo);
        });
        evolutionsHTML = createEvolutionHTML();
    }

    modalBody.innerHTML = `
        <div class="pokemon-details">
            ${preEvolutionsHTML}
            <div class="pokemon-info">
                <h2>${capitalizeFirstLetter(data.name)}</h2>
                <img src="${data.sprites.front_default}" alt="${data.name}">
                <p><strong>ID:</strong> ${data.id}</p>
                <p><strong>Altura:</strong> ${data.height} dm</p>
                <p><strong>Peso:</strong> ${data.weight} hg</p>
                <div class="type-container">
                    ${typesHTML}
                </div>
                <p><strong>Habilidades:</strong> ${data.abilities.map(abilityInfo => capitalizeFirstLetter(abilityInfo.ability.name)).join(', ')}</p>
            </div>
            ${evolutionsHTML}
        </div>
    `;

    modal.style.display = 'flex';
    modalBody.style.display = 'block';
    showLoading(false);
}

async function getPokemonByName(pokemonName) {
    try {
        showLoading(true);

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error('Erro ao carregar Pokemon');
        }

        const data = await response.json();
        showPokemonDetails(data);

        setTimeout(() => {
            showLoading(false);
        }, 1000);
    } catch (error) {
        console.error('Erro ao buscar o Pokemon:', error);
        showLoading(false);
    }
}


function closeModal() {
    const modal = document.getElementById('pokemon-modal');
    modal.style.display = 'none';
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

window.onclick = function(event) {
    const modal = document.getElementById('pokemon-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

