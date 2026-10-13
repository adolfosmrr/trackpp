export type CurrencyOption = {
  country: string
  currency: string
  code: string
}

export type CurrencyRegion = {
  id: string
  name: string
  options: readonly CurrencyOption[]
}

export const DEFAULT_SPACE_CURRENCY: CurrencyOption = {
  country: "Argentina",
  currency: "Peso argentino",
  code: "ARS",
}

const EURO = "Euro"
const USD = "Dólar estadounidense"

function byCountry(left: CurrencyOption, right: CurrencyOption) {
  return left.country.localeCompare(right.country, "es")
}

function region(id: string, name: string, options: CurrencyOption[]): CurrencyRegion {
  return {
    id,
    name,
    options: [...options].sort(byCountry),
  }
}

export function currencyChoiceLabel(option: CurrencyOption) {
  return `${option.country} • ${option.currency} (${option.code})`
}

export const CURRENCY_REGIONS: readonly CurrencyRegion[] = [
  region("europe", "Europa", [
    { country: "Albania", currency: "Lek", code: "ALL" },
    { country: "Alemania", currency: EURO, code: "EUR" },
    { country: "Austria", currency: EURO, code: "EUR" },
    { country: "Bélgica", currency: EURO, code: "EUR" },
    { country: "Bosnia y Herzegovina", currency: "Marco convertible", code: "BAM" },
    { country: "Bulgaria", currency: EURO, code: "EUR" },
    { country: "Chequia", currency: "Corona checa", code: "CZK" },
    { country: "Chipre", currency: EURO, code: "EUR" },
    { country: "Croacia", currency: EURO, code: "EUR" },
    { country: "Dinamarca", currency: "Corona danesa", code: "DKK" },
    { country: "Eslovaquia", currency: EURO, code: "EUR" },
    { country: "Eslovenia", currency: EURO, code: "EUR" },
    { country: "España", currency: EURO, code: "EUR" },
    { country: "Estonia", currency: EURO, code: "EUR" },
    { country: "Finlandia", currency: EURO, code: "EUR" },
    { country: "Francia", currency: EURO, code: "EUR" },
    { country: "Grecia", currency: EURO, code: "EUR" },
    { country: "Hungría", currency: "Forinto", code: "HUF" },
    { country: "Irlanda", currency: EURO, code: "EUR" },
    { country: "Islandia", currency: "Corona islandesa", code: "ISK" },
    { country: "Italia", currency: EURO, code: "EUR" },
    { country: "Letonia", currency: EURO, code: "EUR" },
    { country: "Lituania", currency: EURO, code: "EUR" },
    { country: "Luxemburgo", currency: EURO, code: "EUR" },
    { country: "Macedonia del Norte", currency: "Denar", code: "MKD" },
    { country: "Malta", currency: EURO, code: "EUR" },
    { country: "Moldavia", currency: "Leu moldavo", code: "MDL" },
    { country: "Noruega", currency: "Corona noruega", code: "NOK" },
    { country: "Países Bajos", currency: EURO, code: "EUR" },
    { country: "Polonia", currency: "Zloty", code: "PLN" },
    { country: "Portugal", currency: EURO, code: "EUR" },
    { country: "Reino Unido", currency: "Libra esterlina", code: "GBP" },
    { country: "Rumanía", currency: "Leu rumano", code: "RON" },
    { country: "Serbia", currency: "Dinar serbio", code: "RSD" },
    { country: "Suecia", currency: "Corona sueca", code: "SEK" },
    { country: "Suiza", currency: "Franco suizo", code: "CHF" },
    { country: "Ucrania", currency: "Grivna", code: "UAH" },
  ]),
  region("north-america", "Norteamérica", [
    { country: "Canadá", currency: "Dólar canadiense", code: "CAD" },
    { country: "Estados Unidos", currency: USD, code: "USD" },
    { country: "México", currency: "Peso mexicano", code: "MXN" },
  ]),
  region("central-america", "Centroamérica y Caribe", [
    { country: "Bahamas", currency: "Dólar bahameño", code: "BSD" },
    { country: "Barbados", currency: "Dólar de Barbados", code: "BBD" },
    { country: "Belice", currency: "Dólar beliceño", code: "BZD" },
    { country: "Costa Rica", currency: "Colón costarricense", code: "CRC" },
    { country: "Cuba", currency: "Peso cubano", code: "CUP" },
    { country: "El Salvador", currency: USD, code: "USD" },
    { country: "Guatemala", currency: "Quetzal", code: "GTQ" },
    { country: "Haití", currency: "Gourde", code: "HTG" },
    { country: "Honduras", currency: "Lempira", code: "HNL" },
    { country: "Jamaica", currency: "Dólar jamaiquino", code: "JMD" },
    { country: "Nicaragua", currency: "Córdoba", code: "NIO" },
    { country: "Panamá", currency: "Balboa", code: "PAB" },
    { country: "Puerto Rico", currency: USD, code: "USD" },
    { country: "República Dominicana", currency: "Peso dominicano", code: "DOP" },
    { country: "Trinidad y Tobago", currency: "Dólar de Trinidad y Tobago", code: "TTD" },
  ]),
  region("south-america", "Sudamérica", [
    { country: "Argentina", currency: "Peso argentino", code: "ARS" },
    { country: "Bolivia", currency: "Boliviano", code: "BOB" },
    { country: "Brasil", currency: "Real", code: "BRL" },
    { country: "Chile", currency: "Peso chileno", code: "CLP" },
    { country: "Colombia", currency: "Peso colombiano", code: "COP" },
    { country: "Ecuador", currency: USD, code: "USD" },
    { country: "Guyana", currency: "Dólar guyanés", code: "GYD" },
    { country: "Paraguay", currency: "Guaraní", code: "PYG" },
    { country: "Perú", currency: "Sol", code: "PEN" },
    { country: "Surinam", currency: "Dólar surinamés", code: "SRD" },
    { country: "Uruguay", currency: "Peso uruguayo", code: "UYU" },
    { country: "Venezuela", currency: "Bolívar", code: "VES" },
  ]),
  region("middle-east", "Medio Oriente", [
    { country: "Arabia Saudita", currency: "Riyal saudí", code: "SAR" },
    { country: "Baréin", currency: "Dinar bahreiní", code: "BHD" },
    { country: "Catar", currency: "Riyal catarí", code: "QAR" },
    { country: "Emiratos Árabes Unidos", currency: "Dírham", code: "AED" },
    { country: "Irak", currency: "Dinar iraquí", code: "IQD" },
    { country: "Irán", currency: "Rial iraní", code: "IRR" },
    { country: "Israel", currency: "Nuevo shéquel", code: "ILS" },
    { country: "Jordania", currency: "Dinar jordano", code: "JOD" },
    { country: "Kuwait", currency: "Dinar kuwaití", code: "KWD" },
    { country: "Líbano", currency: "Libra libanesa", code: "LBP" },
    { country: "Omán", currency: "Rial omaní", code: "OMR" },
    { country: "Siria", currency: "Libra siria", code: "SYP" },
    { country: "Turquía", currency: "Lira turca", code: "TRY" },
    { country: "Yemen", currency: "Rial yemení", code: "YER" },
  ]),
  region("asia", "Asia", [
    { country: "Afganistán", currency: "Afgani", code: "AFN" },
    { country: "Bangladés", currency: "Taka", code: "BDT" },
    { country: "Camboya", currency: "Riel", code: "KHR" },
    { country: "China", currency: "Yuan", code: "CNY" },
    { country: "Corea del Sur", currency: "Won", code: "KRW" },
    { country: "Filipinas", currency: "Peso filipino", code: "PHP" },
    { country: "Hong Kong", currency: "Dólar de Hong Kong", code: "HKD" },
    { country: "India", currency: "Rupia india", code: "INR" },
    { country: "Indonesia", currency: "Rupia indonesia", code: "IDR" },
    { country: "Japón", currency: "Yen", code: "JPY" },
    { country: "Kazajistán", currency: "Tenge", code: "KZT" },
    { country: "Laos", currency: "Kip", code: "LAK" },
    { country: "Malasia", currency: "Ringgit", code: "MYR" },
    { country: "Mongolia", currency: "Tugrik", code: "MNT" },
    { country: "Myanmar", currency: "Kyat", code: "MMK" },
    { country: "Nepal", currency: "Rupia nepalí", code: "NPR" },
    { country: "Pakistán", currency: "Rupia pakistaní", code: "PKR" },
    { country: "Singapur", currency: "Dólar de Singapur", code: "SGD" },
    { country: "Sri Lanka", currency: "Rupia de Sri Lanka", code: "LKR" },
    { country: "Tailandia", currency: "Baht", code: "THB" },
    { country: "Taiwán", currency: "Dólar taiwanés", code: "TWD" },
    { country: "Uzbekistán", currency: "Som", code: "UZS" },
    { country: "Vietnam", currency: "Dong", code: "VND" },
  ]),
  region("africa", "África", [
    { country: "Angola", currency: "Kwanza", code: "AOA" },
    { country: "Argelia", currency: "Dinar argelino", code: "DZD" },
    { country: "Benín", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Burkina Faso", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Camerún", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "Chad", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "Costa de Marfil", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Egipto", currency: "Libra egipcia", code: "EGP" },
    { country: "Etiopía", currency: "Birr", code: "ETB" },
    { country: "Gabón", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "Ghana", currency: "Cedi", code: "GHS" },
    { country: "Guinea Ecuatorial", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "Guinea-Bisáu", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Kenia", currency: "Chelín keniano", code: "KES" },
    { country: "Malí", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Marruecos", currency: "Dírham marroquí", code: "MAD" },
    { country: "Mozambique", currency: "Metical", code: "MZN" },
    { country: "Níger", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Nigeria", currency: "Naira", code: "NGN" },
    { country: "República Centroafricana", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "República del Congo", currency: "Franco CFA de África Central", code: "XAF" },
    { country: "Senegal", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Sudáfrica", currency: "Rand", code: "ZAR" },
    { country: "Tanzania", currency: "Chelín tanzano", code: "TZS" },
    { country: "Togo", currency: "Franco CFA de África Occidental", code: "XOF" },
    { country: "Túnez", currency: "Dinar tunecino", code: "TND" },
    { country: "Uganda", currency: "Chelín ugandés", code: "UGX" },
  ]),
  region("oceania", "Oceanía", [
    { country: "Australia", currency: "Dólar australiano", code: "AUD" },
    { country: "Fiyi", currency: "Dólar fiyiano", code: "FJD" },
    { country: "Islas Salomón", currency: "Dólar de las Islas Salomón", code: "SBD" },
    { country: "Nueva Zelanda", currency: "Dólar neozelandés", code: "NZD" },
    { country: "Papúa Nueva Guinea", currency: "Kina", code: "PGK" },
    { country: "Samoa", currency: "Tala", code: "WST" },
    { country: "Tonga", currency: "Paʻanga", code: "TOP" },
    { country: "Vanuatu", currency: "Vatu", code: "VUV" },
  ]),
]
