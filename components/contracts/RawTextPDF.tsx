import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 50,
        fontSize: 11,
        fontFamily: 'Helvetica',
        lineHeight: 1.5,
    },
    text: {
        textAlign: 'justify',
        marginBottom: 8,
    },
    bold: {
        fontWeight: 'bold',
    },
    line: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 4,
    }
});

interface RawTextPDFProps {
    content: string;
    title?: string;
}

export function RawTextPDF({ content, title }: RawTextPDFProps) {
    // Basic parser for **bold** text and line breaks
    const renderParagraphs = () => {
        return content.split('\n').map((paragraph, pIdx) => {
            if (!paragraph.trim()) return <View key={pIdx} style={{ height: 10 }} />;

            // Split by ** to find bold parts
            const parts = paragraph.split(/(\*\*.*?\*\*)/g);

            return (
                <View key={pIdx} style={styles.text}>
                    <Text>
                        {parts.map((part, idx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <Text key={idx} style={styles.bold}>
                                        {part.slice(2, -2)}
                                    </Text>
                                );
                            }
                            return <Text key={idx}>{part}</Text>;
                        })}
                    </Text>
                </View>
            );
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {title && (
                    <View style={{ marginBottom: 20, textAlign: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{title.toUpperCase()}</Text>
                    </View>
                )}
                {renderParagraphs()}
            </Page>
        </Document>
    );
}
