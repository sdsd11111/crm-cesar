import React from 'react';
import { Text, View, StyleSheet, Image, Document, Page } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        paddingTop: 120,
        paddingBottom: 100,
        paddingHorizontal: 75,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
        color: '#333',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        justifyContent: 'flex-end',
    },
    footerImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'bottom',
    },
    pageNumber: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 9,
        color: '#888',
    },
    h1: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 15,
        color: '#000',
        textTransform: 'uppercase',
    },
    h2: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 12,
        color: '#222',
        borderBottom: '1pt solid #ddd',
        paddingBottom: 3,
    },
    h3: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 6,
        marginTop: 10,
        color: '#444',
    },
    text: {
        marginBottom: 8,
        textAlign: 'justify',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 4,
        marginLeft: 10,
    },
    bullet: {
        width: 10,
        fontSize: 12,
    },
    bulletContent: {
        flex: 1,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginVertical: 10,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableColHeader: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f3f4f6',
        padding: 5,
        flex: 1,
    },
    tableCol: {
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 5,
        flex: 1,
    },
    tableCellHeader: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    tableCell: {
        fontSize: 10,
    },
    signatureContainer: {
        marginTop: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBox: {
        width: '45%',
        borderTop: '1pt solid #000',
        paddingTop: 5,
        textAlign: 'center',
    },
    signatureLabel: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    }
});

const sanitizeText = (text: string) => {
    // Strip emojis and extended pictographics that react-pdf standard fonts can't render
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
};

const renderTextWithBold = (text: string) => {
    // First sanitize the string to remove emojis
    const cleanText = sanitizeText(text);
    const parts = cleanText.split('**');
    return parts.map((part, index) => {
        if (index % 2 === 1) { // It's bold
            return <Text key={index} style={{ fontFamily: 'Helvetica-Bold' }}>{part}</Text>;
        }
        return <Text key={index}>{part}</Text>;
    });
};

const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const elements = [];
    let inTable = false;
    let tableHeader: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
        const originalLine = lines[i];
        const line = originalLine.trim();
        if (!line && !inTable) {
            elements.push(<View key={`spacer-${i}`} style={{ height: 10 }} />);
            continue;
        }

        if (line === '---') {
            // Render as a page break to make proposals multi-page and professional
            elements.push(<View key={`break-${i}`} break />);
            continue;
        }

        if (line.startsWith('|')) {
            const cols = line.split('|').filter(c => c.trim() !== '').map(c => c.trim());
            if (!inTable) {
                if (!line.includes('---')) {
                    inTable = true;
                    tableHeader = cols;
                }
            } else {
                if (!line.includes('---')) {
                    tableRows.push(cols);
                }
            }
            if (i + 1 >= lines.length || !lines[i + 1].trim().startsWith('|')) {
                if (inTable) {
                    elements.push(
                        <View key={`table-${i}`} style={styles.table}>
                            <View style={styles.tableRow}>
                                {tableHeader.map((h, idx) => (
                                    <View key={idx} style={styles.tableColHeader}>
                                        <Text style={styles.tableCellHeader}>{h}</Text>
                                    </View>
                                ))}
                            </View>
                            {tableRows.map((row, rIdx) => (
                                <View key={rIdx} style={styles.tableRow}>
                                    {row.map((cell, cIdx) => (
                                        <View key={cIdx} style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{cell}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    );
                    inTable = false;
                    tableHeader = [];
                    tableRows = [];
                }
            }
            continue;
        }

        if (line.startsWith('### ')) {
            elements.push(<Text key={i} style={styles.h3}>{renderTextWithBold(line.replace('### ', ''))}</Text>);
        } else if (line.startsWith('## ')) {
            elements.push(<Text key={i} style={styles.h2}>{renderTextWithBold(line.replace('## ', ''))}</Text>);
        } else if (line.startsWith('# ')) {
            elements.push(<Text key={i} style={styles.h1}>{renderTextWithBold(line.replace('# ', ''))}</Text>);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            const isNested = originalLine.startsWith('  ') || originalLine.startsWith('\t');
            elements.push(
                <View key={i} style={[styles.bulletPoint, isNested ? { marginLeft: 25 } : {}]}>
                    <Text style={styles.bullet}>{isNested ? '◦' : '•'}</Text>
                    <Text style={styles.bulletContent}>{renderTextWithBold(line.replace(/^[-*] /, ''))}</Text>
                </View>
            );
        } else {
            elements.push(<Text key={i} style={styles.text}>{renderTextWithBold(line)}</Text>);
        }
    }

    return <>{elements}</>;
};

interface UniversalPdfDocumentProps {
    content: string;
    logoUrl?: string;
    footerUrl?: string;
    showSignatureLines?: boolean;
    signerName?: string;
    clientName?: string;
}

export const UniversalPdfDocument = ({
    content,
    logoUrl,
    footerUrl,
    showSignatureLines = false,
    signerName = "Ing. César Reyes Jaramillo",
    clientName = "EL CLIENTE"
}: UniversalPdfDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View fixed style={styles.header}>
                {logoUrl && <Image style={styles.headerImage} src={logoUrl} />}
            </View>

            <View>
                <MarkdownRenderer content={content} />
            </View>

            {showSignatureLines && (
                <View style={styles.signatureContainer} wrap={false}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>{signerName}</Text>
                        <Text style={styles.signatureLabel}>PROVEEDOR</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <Text style={styles.signatureLabel}>{clientName}</Text>
                        <Text style={styles.signatureLabel}>EL CONTRATANTE</Text>
                    </View>
                </View>
            )}

            <View fixed style={styles.footer}>
                {footerUrl && <Image style={styles.footerImage} src={footerUrl} />}
            </View>

            <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
                fixed
            />
        </Page>
    </Document>
);
