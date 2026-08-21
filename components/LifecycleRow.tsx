import { View, Text, StyleSheet } from "react-native";

interface Props {
    label: string;
    value: number;
}

export default function LifecycleRow({
    label,
    value,
}: Props) {

    return (
        <View style={styles.row}>

            <Text style={styles.label}>
                {label}
            </Text>

            <View style={styles.badge}>
                <Text style={styles.badgeText}>
                    {value}
                </Text>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    row:{
        flexDirection:"row",
        justifyContent:"space-between",
        alignItems:"center",

        paddingVertical:10,
    },

    label:{
        fontSize:13,
        fontWeight:"700",
        color:"#222",
    },

    badge:{
        minWidth:38,
        paddingHorizontal:10,
        paddingVertical:5,

        borderRadius:20,

        backgroundColor:"#111",
        alignItems:"center",
    },

    badgeText:{
        color:"#FFF",
        fontWeight:"900",
    }

});