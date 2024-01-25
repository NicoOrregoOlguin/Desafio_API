document.addEventListener('DOMContentLoaded', function() {
  const montoInput = document.getElementById('monto');
  const monedaSelect = document.getElementById('moneda');
  const buscarBtn = document.getElementById('buscar');
  const resultadoDiv = document.getElementById('resultado');
  const graficoContainer = document.querySelector('.grafico-container'); 
  const ctx = document.getElementById('historialMoneda').getContext('2d');
  let historialChart = null;

  async function cargarMonedas() {
    try {
      const response = await fetch('https://mindicador.cl/api');
      if (!response.ok) {
        throw new Error('Error al obtener los indicadores económicos');
      }
      const data = await response.json();
      for (const key in data) {
        if (data.hasOwnProperty(key) && data[key].codigo) {
          let option = document.createElement('option');
          option.value = key;
          option.textContent = data[key].nombre;
          monedaSelect.appendChild(option);
        }
      }
    } catch (error) {
      resultadoDiv.textContent = 'Error al cargar las monedas: ' + error.message;
    }
  }

  async function actualizarGrafico(moneda) {
    try {
      const response = await fetch(`https://mindicador.cl/api/${moneda}`);
      if (!response.ok) {
        throw new Error('Error al obtener el historial de la moneda');
      }
      const datosMoneda = await response.json();

      if (!datosMoneda.serie || datosMoneda.serie.length === 0) {
        throw new Error('No hay datos históricos disponibles');
      }

      const fechas = datosMoneda.serie.slice(0, 10).map(dato => new Date(dato.fecha).toLocaleDateString());
      const valores = datosMoneda.serie.slice(0, 10).map(dato => dato.valor);

      if (historialChart) {
        historialChart.destroy();
      }

      historialChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: fechas,
          datasets: [{
            label: `Valor de ${datosMoneda.nombre} en los últimos 10 días`,
            data: valores,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    } catch (error) {
      console.error('Error al cargar el gráfico: ' + error.message);
    }
  }

  cargarMonedas();

  buscarBtn.addEventListener('click', async function() {
    const monto = montoInput.value;
    const monedaSeleccionada = monedaSelect.value;

    if (!monto || monedaSeleccionada === 'Seleccione moneda') {
      resultadoDiv.textContent = 'Por favor, ingrese un monto y seleccione una moneda.';
      return;
    }

    try {
      const response = await fetch(`https://mindicador.cl/api/${monedaSeleccionada}`);
      if (!response.ok) {
        throw new Error('Error al obtener la conversión de moneda');
      }
      const indicador = await response.json();
      if (!indicador.serie || indicador.serie.length === 0) {
        throw new Error('No hay datos disponibles para la moneda seleccionada');
      }
      const valorMoneda = indicador.serie[0].valor;
      const conversion = (monto / valorMoneda).toFixed(2);
      resultadoDiv.textContent = `Resultado: $${conversion}`;
      

      graficoContainer.style.display = 'block';
      
    
      actualizarGrafico(monedaSeleccionada);
    } catch (error) {
      resultadoDiv.textContent = 'Error al realizar la conversión: ' + error.message;

      graficoContainer.style.display = 'none';
      console.error(error);
    }
  });
});
