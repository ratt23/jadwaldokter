exports.handler = async (event) => {
    const imageUrl = event.queryStringParameters.url;

    if (!imageUrl) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing url parameter' })
        };
    }

    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch image', details: error.message })
        };
    }
};
