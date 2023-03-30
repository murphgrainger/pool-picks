export const redirectToHome = () => ({
      redirect: {
        destination: '/',
        permanent: false,
      }
  })


  export const formatToPar = (score : number | null) => {
    const underParFormatted = score === null
    ? '--'
    : score === 0
    ? 'E'
    : score > 0
    ? `+${score}`
    : score < 0
    ? `${score}`
    : ''

    return underParFormatted;
  }