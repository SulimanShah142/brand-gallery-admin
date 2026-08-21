import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    title:string;
    subtitle:string;
    icon:any;
    onPress:()=>void;
}

export default function DashboardButton({
    title,
    subtitle,
    icon,
    onPress,
}:Props){

    return(

        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
        >

            <View style={styles.icon}>
                <Ionicons
                    name={icon}
                    size={22}
                    color="#FFF"
                />
            </View>

            <View style={{flex:1}}>

                <Text style={styles.title}>
                    {title}
                </Text>

                <Text style={styles.subtitle}>
                    {subtitle}
                </Text>

            </View>

            <Ionicons
                name="chevron-forward"
                size={18}
                color="#AAA"
            />

        </TouchableOpacity>

    );

}

const styles=StyleSheet.create({

    card:{
        flexDirection:"row",
        alignItems:"center",

        backgroundColor:"#FFF",

        padding:18,

        borderRadius:16,

        marginBottom:14,
    },

    icon:{
        width:46,
        height:46,

        borderRadius:23,

        backgroundColor:"#111",

        justifyContent:"center",
        alignItems:"center",

        marginRight:14,
    },

    title:{
        fontSize:14,
        fontWeight:"900",
        color:"#111",
    },

    subtitle:{
        fontSize:12,
        color:"#888",
        marginTop:2,
    }

});