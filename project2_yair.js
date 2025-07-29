$(document).ready(async () => {

    const getExpensiveCoins = async () => {
        try {
            const url = 'https://api.coingecko.com/api/v3/coins/markets';
            const params = {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 100,
                page: 1
            };
            const coins = await $.ajax(url, { data: params });
            return coins;
        } catch (error) {
            console.error('Error fetching coins:', error);
            return null;
        }
    };


    const getSpecificCoinData = async (coinId) => {

        const savedData = JSON.parse(localStorage.getItem(coinId) || '{}');
        if (savedData.coinData && savedData.lastUpdated) {
            const lastUpdated = new Date(savedData.lastUpdated);
            const twoMinutes = 2 * 60 * 1000;
            const difference = Math.abs(Date.now() - lastUpdated);

            if (difference <= twoMinutes) {
                console.log(`Fetch existing data from the cache to the coin: ${coinId}`);
                return savedData.coinData;
            }
        }

        try {
            const coinData = await $.ajax(`https://api.coingecko.com/api/v3/coins/${coinId}`);

            localStorage.setItem(coinId, JSON.stringify({
                coinData,
                lastUpdated: new Date(),
            }));

            console.log(`Brings new data from API to currency: ${coinId}`);
            return coinData;
        } catch (err) {
            console.error('Error retrieving coin data:', err);
            throw err;
        }
    };

    const showSelectedCoinsInModal = async () => {
        let html = ''
        $('.checkbox-input:checked').each((index, el) => {
            const coinId = $(el).attr('coinId')
            const coinName = $(el).attr('coinName')
            html += `<div class="selectedCoin">
            <p>${coinName} - ${coinId}</p>
            <div class="form-check form-switch"><input class="form-check-input modalCheckbox" type="checkbox" role="switch" checked="true" coinName="${coinName}" coinId="${coinId}"/></div>
            </div>`
        })
        $('#exampleModal .modal-body').html(html)

        $('#exampleModal .modal-body .modalCheckbox').off('click').on('click', (event) => {
            const coinId = $(event.target).attr('coinid')
            const checked = $(event.target).prop('checked')
            $('.coins [coinid=' + coinId + ']').prop('checked', checked)
        })
    }

    // const coinsData = $.ajax('https://min-api.cryptocompare.com/data/pricemulti?fsyms=ETH,BTC&tsyms=USD')

    const printChart = async () => {

        // setInterval(() => {
        const selectedCoinsElements = $('.checkbox-input:checked')
        if (selectedCoinsElements.length === 0) {
            $("#chart").html(`<p class="NoteToTheGraph">You must select up to five currencies to display the chart.</p>`)
            return
        }
        const selectedCoins = []
        const promises = []

        selectedCoinsElements.each((index, el) => {
            const coinId = $(el).attr('coinid')
            promises.push(getSpecificCoinData(coinId))
        })

        try {
            const coinsData = await Promise.all(promises)

            coinsData.map((coinData) => {
                const coinPrice = coinData.market_data.current_price.usd

                selectedCoins.push({
                    type: "line",
                    showInLegend: true,
                    name: coinData.id,
                    markerType: "square",
                    xValueFormatString: "DD MMM, YYYY",
                    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                    yValueFormatString: "$#,##0.00",
                    dataPoints: [
                        { x: new Date(2024, 11, 1), y: coinPrice },
                        { x: new Date(2024, 11, 2), y: coinPrice * 1.05 },
                        { x: new Date(2024, 11, 3), y: coinPrice * 0.95 },
                        { x: new Date(2024, 11, 4), y: coinPrice * 1.1 },
                        { x: new Date(2024, 11, 5), y: coinPrice }
                    ]
                })
            })

            const options = {
                animationEnabled: true,
                theme: "light2",
                title: {
                    text: "My live coin prices"
                },
                axisX: {
                    valueFormatString: "DD MMM"
                },
                axisY: {
                    title: "Price in USD",
                    prefix: "$"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "bottom",
                    horizontalAlign: "left",
                    dockInsidePlotArea: true,
                    itemclick: (e) => {
                        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                            e.dataSeries.visible = false
                        } else {
                            e.dataSeries.visible = true
                        }
                        e.chart.render()
                    }
                },
                data: selectedCoins
            };

            $("#chart").CanvasJSChart(options)

        } catch (error) {
            console.error("Error fetching coin data:", error)
        }


        // }, 2000)
    }


    $('#exampleModal').on('show.bs.modal', () => {
        showSelectedCoinsInModal()
    })


    $('.link').click((event) => {
        const page = $(event.currentTarget).attr('pageTitle')
        if (!page) {
            console.error('Attribute pageTitle is missing!')
            return;
        }
        if (page === 'reports')
            printChart()

        $('.page').hide()
        $(`.${page}`).show('slow')
    });


    $('#Search').click(() => {
        const searchValue = $('#text').val().toLowerCase()
        const matchingCoin = coins.find(coin => coin.name.toLowerCase() === searchValue || coin.id.toLowerCase() === searchValue)


        if (matchingCoin) {
            $('.coin').hide()
            const coinElement = $(`#${matchingCoin.id}`).closest('.coin')
            coinElement.show()
            $('#delete').css('display', 'block')
            console.log(`Found coin: ${matchingCoin.name} (${matchingCoin.id})`)
        } else alert('No coin matches your search.')
    })


    $('#delete').click(() => {
        $('#text').val('')
        $('.coin').show()
        $('#delete').css('display', 'none')
    })


    $('#Report').prop('disabled', true)
    $('.coins').on('click', '.checkbox-input', (event) => {
        const checkedCount = $('.checkbox-input:checked').length
        console.log('Checked count:', checkedCount)

        if (checkedCount > 5) {
            $(event.target).prop('checked', false)
            showSelectedCoinsInModal()
        }

        if (checkedCount > 0) {
            $('#Report').prop('disabled', false)
        } else $('#Report').prop('disabled', true)

        if (checkedCount === 5) {
            $('#exampleModal').modal('show')
        }
    })


    const coins = await getExpensiveCoins()
    let html = ''
    coins.map(coin => {
        html += `<div class="coin">
        <div class="head">
        <h3> ${coin.name} </h3>
        <div class="form-check form-switch"><input class="form-check-input checkbox-input" type="checkbox" role="switch" coinName="${coin.name}" coinId="${coin.id}"/></div>
        </div>
        <h6>${coin.id}  </h6>
        <button id="${coin.id}" class="btn btn-outline-dark more">More info</button>
        </div>`
    })
    $('.coins').html(html)


    $('.coin button').click(async (event) => {
        const button = $(event.target)

        if (button.text() === 'Hide') {
            button.parent().find('.moreInfo,img').hide('slow')
            button.text('More info')
            button.removeClass('hide')
        } else {

            const loding = `<div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
            </div>`
            button.html(loding + 'Loading...')
            button.attr('disabled', true)

            const coinData = await getSpecificCoinData(event.target.id)
            button.text('Hide')
            button.addClass('hide')
            button.removeAttr('disabled')

            const ils = coinData.market_data.current_price.ils.toLocaleString()
            const eur = coinData.market_data.current_price.eur.toLocaleString()
            const usd = coinData.market_data.current_price.usd.toLocaleString()

            let html = `<div class="moreInfo"><br>
                        <p>ILS: ₪ ${ils} </p>
                        <p>EUR: € ${eur} </p>
                        <p>USD: $ ${usd} </p></div>`
                        button.parent().append(`<img src=" ${coinData.image.thumb} "/>`)
                        button.parent().append(html)
        }
    })
})