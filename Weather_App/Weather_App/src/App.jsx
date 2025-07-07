import { useState } from 'react'

function App() {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [unit, setUnit] = useState('metric') // 'metric' for Celsius, 'imperial' for Fahrenheit

  const API_KEY = 'fc846b3d9c4d8f6b5f5037c0c75be998'
  const API_URL = 'https://api.openweathermap.org/data/2.5/weather'
  const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast'

  // Helper for temperature unit symbol
  const tempSymbol = unit === 'metric' ? '°C' : '°F'

  // Helper for background gradient based on weather
  const getBgGradient = () => {
    if (!weather) return 'from-blue-400 via-blue-500 to-purple-600'
    const main = weather.weather[0].main.toLowerCase()
    if (main.includes('cloud')) return 'from-gray-400 via-gray-500 to-blue-700'
    if (main.includes('rain')) return 'from-blue-700 via-blue-500 to-gray-400'
    if (main.includes('clear')) return 'from-yellow-200 via-blue-300 to-blue-500'
    if (main.includes('snow')) return 'from-blue-200 via-white to-blue-400'
    if (main.includes('thunder')) return 'from-gray-700 via-yellow-400 to-gray-900'
    if (main.includes('mist') || main.includes('fog')) return 'from-gray-300 via-gray-400 to-gray-600'
    return 'from-blue-400 via-blue-500 to-purple-600'
  }

  // Fetch current weather and forecast
  const fetchWeather = async (cityName, unitType = unit, coords = null) => {
    if (!cityName && !coords) return
    setLoading(true)
    setError('')
    try {
      let weatherRes, forecastRes
      if (coords) {
        weatherRes = await fetch(`${API_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=${unitType}`)
        forecastRes = await fetch(`${FORECAST_URL}?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=${unitType}`)
      } else {
        weatherRes = await fetch(`${API_URL}?q=${cityName}&appid=${API_KEY}&units=${unitType}`)
        forecastRes = await fetch(`${FORECAST_URL}?q=${cityName}&appid=${API_KEY}&units=${unitType}`)
      }
      if (!weatherRes.ok) throw new Error('City not found')
      const weatherData = await weatherRes.json()
      setWeather(weatherData)
      if (forecastRes.ok) {
        const forecastData = await forecastRes.json()
        // Get one forecast per day (at 12:00)
        const daily = forecastData.list.filter(item => item.dt_txt.includes('12:00:00'))
        setForecast(daily.slice(0, 5))
      } else {
        setForecast([])
      }
    } catch (err) {
      setError(err.message)
      setWeather(null)
      setForecast([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchWeather(city)
  }

  const handleUnitToggle = () => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric'
    setUnit(newUnit)
    if (weather) {
      fetchWeather(weather.name, newUnit)
    }
  }

  const handleGeo = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather('', unit, { lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        setError('Unable to retrieve your location')
        setLoading(false)
      }
    )
  }

  // Spinner component
  const Spinner = () => (
    <div className="flex justify-center items-center my-8">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  // Helper for sunrise/sunset
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 bg-gradient-to-br ${getBgGradient()}`}>
      <div className="glass-card p-10 w-full max-w-xl flex flex-col items-center shadow-2xl">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight uppercase drop-shadow-lg">Weather App</h1>
        <form onSubmit={handleSubmit} className="mb-8 w-full flex flex-col sm:flex-row gap-4 items-center justify-center">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city name..."
            className="tesla-input w-full sm:w-auto flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="tesla-btn"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={handleGeo}
            disabled={loading}
            className="tesla-btn bg-green-500 hover:bg-green-600"
          >
            📍
          </button>
        </form>
        <div className="tesla-divider w-full" />
        <div className="flex justify-center mb-6">
          <button
            onClick={handleUnitToggle}
            className="tesla-btn bg-gray-200 text-gray-700 hover:bg-blue-200"
          >
            {unit === 'metric' ? 'Show °F' : 'Show °C'}
          </button>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 w-full text-center">
            {error}
          </div>
        )}
        {loading && <Spinner />}
        {weather && !loading && (
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {weather.name}, {weather.sys.country}
              </h2>
              {/* Country flag */}
              <img
                src={`https://flagsapi.com/${weather.sys.country}/flat/32.png`}
                alt={weather.sys.country}
                className="inline-block rounded shadow"
                style={{ width: 32, height: 24 }}
              />
            </div>
            {/* Weather icon */}
            <div className="flex justify-center mb-2">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
                className="w-28 h-28 drop-shadow-xl"
              />
            </div>
            <div className="text-7xl font-extrabold text-blue-700 mb-2 tracking-tight">
              {Math.round(weather.main.temp)}{tempSymbol}
            </div>
            <div className="text-2xl text-gray-700 mb-6 capitalize font-semibold">
              {weather.weather[0].description}
            </div>
            {/* More weather details */}
            <div className="grid grid-cols-2 gap-4 text-base mb-6">
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-gray-500">Humidity</div>
                <div className="font-bold text-lg">{weather.main.humidity}%</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-gray-500">Wind Speed</div>
                <div className="font-bold text-lg">{weather.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-gray-500">Pressure</div>
                <div className="font-bold text-lg">{weather.main.pressure} hPa</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-gray-500">Visibility</div>
                <div className="font-bold text-lg">{weather.visibility / 1000} km</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm col-span-2">
                <div className="text-gray-500">Sunrise / Sunset</div>
                <div className="font-bold text-lg">{formatTime(weather.sys.sunrise)} / {formatTime(weather.sys.sunset)}</div>
              </div>
            </div>
            {/* 5-day forecast */}
            {forecast.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-3 text-gray-800 uppercase tracking-wide">5-Day Forecast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {forecast.map((item, idx) => (
                    <div key={idx} className="bg-white/60 rounded-xl p-3 flex flex-col items-center shadow-sm hover:scale-105 transition-transform duration-200">
                      <div className="font-semibold text-gray-700 mb-1">
                        {new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <img
                        src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                        alt={item.weather[0].description}
                        className="w-12 h-12"
                      />
                      <div className="text-blue-700 font-bold text-lg">
                        {Math.round(item.main.temp)}{tempSymbol}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {item.weather[0].description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
